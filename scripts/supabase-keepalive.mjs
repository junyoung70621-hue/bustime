// ─────────────────────────────────────────────────────────────
// Supabase 무료 플랜 자동 일시정지 방지 (하루 1회 crontab)
//   예전 팀즈 글의 캡처 이미지가 Supabase captures 버킷 주소라서 프로젝트를 계속 살려둬야 한다.
//   Storage·REST 를 한 번씩 호출해 "사용 중"으로 유지. 실패하면 exit 1.
// 실행(서버): docker compose exec -T web node scripts/supabase-keepalive.mjs
// ─────────────────────────────────────────────────────────────
import { loadEnv } from "./pg-config.mjs";

const env = loadEnv();
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.");
  process.exit(1);
}
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const storage = await fetch(`${url}/storage/v1/bucket`, { headers });
const rest = await fetch(`${url}/rest/v1/`, { headers });
console.log(`${new Date().toISOString()} supabase keepalive storage=${storage.status} rest=${rest.status}`);
if (!storage.ok || !rest.ok) process.exit(1);
