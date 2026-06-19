"use client";

// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트(지역) A4 양식 (미리보기 + PDF 캡처 공용)
//   본문은 선택 모델(REG_MODELS_DATA[model])의 행을 그대로 렌더 — 모델별 상이.
//   8열: 케이스(번호·케이스명)·점검대상·점검항목·점검방법·점검POINT·O/X·비고
//   헤더는 모델별 구성(REG_HEADER) — ID/IH, 교체전후, F/W 버전행 등.
// ─────────────────────────────────────────────────────────────
import { REG_MODELS_DATA, REG_HEADER, regCheckKey } from "@/lib/checklist-regional/templates";
import type { RegFormState, RegModel } from "@/lib/checklist-regional/types";
import type { CkRowDef, CkCellKey } from "@/lib/checklist/types";

const c = "border border-slate-700 px-1.5 py-1 align-middle";
const cMid = "border border-slate-700 px-1.5 py-1 align-middle text-center";
const hd = "border border-slate-700 px-1 py-1 bg-slate-100 text-center font-bold whitespace-pre-line";
const labCell = "border border-slate-700 px-1.5 py-1 align-middle bg-slate-50 font-bold text-center";

export default function RegionalChecklistForm({ data }: { data: RegFormState }) {
  const def = data.model ? REG_MODELS_DATA[data.model] : undefined;
  const title = def?.title ?? `${data.model || ""} 단말기 체크 리스트`;
  const rows: CkRowDef[] = def?.rows ?? [];

  return (
    <div className="w-[840px] bg-white px-7 py-6 text-[11px] text-slate-900" style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', sans-serif" }}>
      {data.region ? <div className="mb-1 text-right text-[11px] font-bold text-slate-500">{data.region}</div> : null}

      <div className="mb-2 bg-[#22324a] py-2.5 text-center text-xl font-extrabold tracking-wide text-white">{title}</div>

      <RegHeader data={data} />
      <p className="mb-2 text-center text-[11px]">
        <span className="mr-6">{fmtDate(data.confirmDate)}</span>
        <span className="font-bold">설치일과 체크리스트 확인일의 일치여부</span>를 확인합니다.
      </p>

      {/* 점검표 */}
      <table className="w-full border-collapse text-[9.5px] leading-tight">
        <thead>
          <tr>
            <th className={`${hd} w-[4%]`} colSpan={2}>케이스</th>
            <th className={`${hd} w-[12%]`}>{"점검대상\n단말기"}</th>
            <th className={`${hd} w-[11%]`}>점검항목</th>
            <th className={`${hd} w-[15%]`}>점검방법</th>
            <th className={`${hd} w-[32%]`}>점검POINT</th>
            <th className={`${hd} w-[6%]`}>O/X</th>
            <th className={`${hd} w-[10%]`}>비고</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <Cell r={r} col="caseNo" cls={cMid}>{r.caseNo}</Cell>
              <Cell r={r} col="caseLabel" cls={`${cMid} whitespace-pre-line`}>{r.caseLabel}</Cell>
              <Cell r={r} col="target" cls={`${cMid} whitespace-pre-line`}>{r.target}</Cell>
              <Cell r={r} col="item" cls={`${c} whitespace-pre-line`}>{r.item}</Cell>
              <Cell r={r} col="method" cls={`${c} whitespace-pre-line`}>{r.method}</Cell>
              <Cell r={r} col="point" cls={`${c} whitespace-pre-line`}>{pointFor(r, data)}</Cell>
              <Cell r={r} col="ox" cls={`${cMid} font-bold`}>{oxFor(r, data, i)}</Cell>
              <Cell r={r} col="bigo" cls={`${c} whitespace-pre-line text-[9px] text-slate-500`}>{r.bigo}</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function pointFor(r: CkRowDef, data: RegFormState): React.ReactNode {
  if (r.kind === "etc") return data.etcContent || "";
  return r.point;
}

function oxFor(r: CkRowDef, data: RegFormState, i: number): React.ReactNode {
  switch (r.kind) {
    case "vehicleType":
      return data.vehicleType ? data.vehicleType.trim().slice(-1) : "";
    case "partition":
      return data.partition;
    case "etc":
      return data.etcQty;
    case "check":
      return data.checks[regCheckKey(data.model, i)] ? "○" : "";
    default:
      return "";
  }
}

// 원본 병합 반영 셀: r.m[col] 없으면 병합에 가려진 셀 → 렌더 안 함
function Cell({ r, col, cls, children }: { r: CkRowDef; col: CkCellKey; cls: string; children: React.ReactNode }) {
  const sp = r.m?.[col];
  if (!sp) return null;
  return (
    <td className={cls} rowSpan={sp[0]} colSpan={sp[1]}>
      {children}
    </td>
  );
}

// 모델별 헤더 (점검자 박스는 우측에 전체 행 병합)
function RegHeader({ data }: { data: RegFormState }) {
  const cfg = data.model ? REG_HEADER[data.model as RegModel] : undefined;
  if (!cfg) return null;
  const tri = (a: string, b: string, d: string) => `${a || ""} / ${b || ""} / ${d || ""}`;

  // B400: 운수사명/ID 인라인 + F/W·교체 없음 →
  //   승.하차단말기 IH를 우측에 2행 병합(차량번호 행의 빈칸 흡수), 운전자단말기 IH는 좌측 하단.
  if (cfg.operatorIdInline && !cfg.fwRow && !cfg.beforeAfter) {
    return (
      <table className="mb-2 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className={`${labCell} w-[13%]`}>점검일</td>
            <td className={`${cMid} w-[22%]`}>{fmtDate(data.inspectDate)}</td>
            <td className={`${labCell} w-[15%]`}>운수사명 / 운수사ID</td>
            <td className={cMid}>{data.operatorName}{data.operatorId ? ` / ${data.operatorId}` : ""}</td>
            <td className={`${labCell} w-[10%]`} rowSpan={3}>점검자</td>
            <td className={`${cMid} w-[14%]`} rowSpan={3}><SealStack name={data.inspectorName} sig={data.inspectorSig} /></td>
          </tr>
          <tr>
            <td className={labCell}>차량번호</td>
            <td className={cMid}>{data.vehicleNo}</td>
            <td className={labCell} rowSpan={2}>{cfg.idLabel}</td>
            <td className={cMid} rowSpan={2}>{tri(data.seungCha, data.hacha1, data.hacha2)}</td>
          </tr>
          <tr>
            <td className={labCell}>{cfg.driverLabel}</td>
            <td className={cMid}>{data.driverId}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  // B500/B650: 운수사ID 없음 + F/W 버전행 →
  //   운수사명을 아래 빈칸(차량번호 행 우측)과 2행 병합. 차량번호는 점검일 아래.
  if (cfg.fwRow) {
    return (
      <table className="mb-2 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className={`${labCell} w-[13%]`}>점검일</td>
            <td className={`${cMid} w-[22%]`}>{fmtDate(data.inspectDate)}</td>
            <td className={`${labCell} w-[15%]`} rowSpan={2}>운수사명</td>
            <td className={cMid} rowSpan={2}>{data.operatorName}</td>
            <td className={`${labCell} w-[10%]`} rowSpan={4}>점검자</td>
            <td className={`${cMid} w-[14%]`} rowSpan={4}><SealStack name={data.inspectorName} sig={data.inspectorSig} /></td>
          </tr>
          <tr>
            <td className={labCell}>차량번호</td>
            <td className={cMid}>{data.vehicleNo}</td>
          </tr>
          <tr>
            <td className={labCell}>{cfg.idLabel}</td>
            <td className={cMid}>{tri(data.seungCha, data.hacha1, data.hacha2)}</td>
            <td className={labCell}>{cfg.driverLabel}</td>
            <td className={cMid}>{data.driverId}</td>
          </tr>
          <tr>
            <td className={`${labCell} whitespace-pre-line`}>승.하차1,하차2 단말기 F/W</td>
            <td className={cMid}>{tri(data.seungChaFw, data.hacha1Fw, data.hacha2Fw)}</td>
            <td className={labCell}>운전자단말기 F/W</td>
            <td className={cMid}>{data.driverFw}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  const info: [string, React.ReactNode, string, React.ReactNode][] = [];
  info.push([
    "점검일",
    fmtDate(data.inspectDate),
    cfg.operatorIdInline ? "운수사명 / 운수사ID" : "운수사명",
    cfg.operatorIdInline ? `${data.operatorName}${data.operatorId ? ` / ${data.operatorId}` : ""}` : data.operatorName,
  ]);
  info.push([
    "차량번호",
    data.vehicleNo,
    cfg.hasOperatorId && !cfg.operatorIdInline ? "운수사ID" : "",
    cfg.hasOperatorId && !cfg.operatorIdInline ? data.operatorId : "",
  ]);
  info.push([
    cfg.beforeAfter ? `교체전 ${cfg.idLabel}` : cfg.idLabel,
    tri(data.seungCha, data.hacha1, data.hacha2),
    cfg.beforeAfter ? `교체전 ${cfg.driverLabel}` : cfg.driverLabel,
    data.driverId,
  ]);
  if (cfg.beforeAfter) {
    info.push([
      `교체후 ${cfg.idLabel}`,
      tri(data.seungChaAfter, data.hacha1After, data.hacha2After),
      `교체후 ${cfg.driverLabel}`,
      data.driverIdAfter,
    ]);
  }
  if (cfg.fwRow) {
    info.push([
      "승.하차1,하차2 단말기 F/W",
      tri(data.seungChaFw, data.hacha1Fw, data.hacha2Fw),
      "운전자단말기 F/W",
      data.driverFw,
    ]);
  }

  return (
    <table className="mb-2 w-full border-collapse text-[11px]">
      <tbody>
        {info.map((r, idx) => (
          <tr key={idx}>
            <td className={`${labCell} w-[13%]`}>{r[0]}</td>
            <td className={`${cMid} w-[22%]`}>{r[1]}</td>
            <td className={`${labCell} w-[15%] whitespace-pre-line`}>{r[2]}</td>
            <td className={cMid}>{r[3]}</td>
            {idx === 0 && (
              <>
                <td className={`${labCell} w-[10%]`} rowSpan={info.length}>점검자</td>
                <td className={`${cMid} w-[14%]`} rowSpan={info.length}>
                  <SealStack name={data.inspectorName} sig={data.inspectorSig} />
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 서명을 (인) 위에 표기 (이름 → 서명 → (인))
function SealStack({ name, sig }: { name?: string; sig: string | null }) {
  return (
    <div className="text-center leading-none">
      {name ? <div className="mb-0.5 font-bold">{name}</div> : null}
      <div style={{ height: 22 }}>
        {sig ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sig} alt="서명" className="inline-block" style={{ maxHeight: 22, maxWidth: 70 }} />
        ) : null}
      </div>
      <div className="text-[10px]">(인)</div>
    </div>
  );
}

function fmtDate(d: string): string {
  if (!d) return "년    월    일";
  const [y, m, day] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
}
