// ─────────────────────────────────────────────────────────────
// DB 셋업: 테이블(재)생성 + routes/vehicles CSV 적재 + 검증
// 실행: node scripts/db-setup.mjs
// ─────────────────────────────────────────────────────────────
import pg from "pg";
import { readFileSync } from "fs";

const root = new URL("..", import.meta.url);
const env = {};
for (const line of readFileSync(new URL(".env.local", root), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const client = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER,
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

// 간단한 CSV 파서 (따옴표/이스케이프 처리, 한 줄 단위)
function parseCsvLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function loadCsv(name) {
  const text = readFileSync(new URL(`supabase/${name}`, root), "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = parseCsvLine(l);
    const o = {};
    header.forEach((h, i) => (o[h] = cells[i] ?? ""));
    return o;
  });
}

async function bulkInsert(table, cols, rows, toValues) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const params = [];
    const tuples = slice.map((r, ri) => {
      const vals = toValues(r);
      const ph = vals.map((_, vi) => `$${ri * cols.length + vi + 1}`);
      params.push(...vals);
      return `(${ph.join(",")})`;
    });
    await client.query(
      `insert into ${table} (${cols.join(",")}) values ${tuples.join(",")} on conflict do nothing`,
      params,
    );
    process.stdout.write(`\r  ${table}: ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }
  process.stdout.write("\n");
}

async function main() {
  await client.connect();
  console.log("✅ DB 연결 성공");

  // 1) 기존 테이블 정리 후 스키마 생성 (프로토타입 - 깨끗이 재구축)
  console.log("기존 테이블 정리...");
  await client.query("drop table if exists public.vehicles cascade");
  await client.query("drop table if exists public.routes cascade");

  console.log("스키마 생성...");
  const schema = readFileSync(new URL("supabase/schema.sql", root), "utf8");
  await client.query(schema);

  // 2) routes 적재
  const routes = loadCsv("routes.csv");
  console.log(`routes 적재 (${routes.length})`);
  await bulkInsert(
    "public.routes",
    ["route_id", "route_name"],
    routes,
    (r) => [r.route_id, r.route_name],
  );

  // 3) vehicles 적재 (route_id 빈값 → null)
  const vehicles = loadCsv("vehicles.csv");
  console.log(`vehicles 적재 (${vehicles.length})`);
  await bulkInsert(
    "public.vehicles",
    ["plate_no", "vehicle_id", "route_id", "route_name", "garage_name", "operator"],
    vehicles,
    (r) => [r.plate_no, r.vehicle_id, r.route_id || null, r.route_name, r.garage_name, r.operator],
  );

  // 4) 검증
  const a = await client.query("select count(*)::int n from public.vehicles");
  const b = await client.query("select count(*)::int n from public.routes");
  const c = await client.query(
    "select plate_no, route_id, route_name from public.vehicles where plate_no like '%8915' limit 3",
  );
  console.log(`\n검증 → vehicles=${a.rows[0].n}, routes=${b.rows[0].n}`);
  console.log("샘플(끝자리 8915):", c.rows);

  await client.end();
  console.log("🎉 완료");
}

main().catch(async (e) => {
  console.error("실패:", e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
