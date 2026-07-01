"use client";

// ─────────────────────────────────────────────────────────────
// 인천 B820 설치완료 체크리스트 A4 양식 (미리보기 + PDF 캡처 공용)
//   상단 헤더(설치자 확인만) + 본문 8열 점검표(INC_ROWS, 병합 반영).
//   태그리스·좌석표시기·전자노선도는 "해당없음" 체크 시 O칸에 "해당없음" 표기.
// ─────────────────────────────────────────────────────────────
import { INC_ROWS, INC_TITLE } from "@/lib/checklist-incheon/templates";
import type { IncFormState, IncRowDef, CkCellKey } from "@/lib/checklist-incheon/types";

const c = "border border-slate-700 px-1.5 py-1 align-middle";
const cMid = "border border-slate-700 px-1.5 py-1 align-middle text-center";
const hd = "border border-slate-700 px-1 py-1 bg-slate-100 text-center font-bold whitespace-pre-line";
const labCell = "border border-slate-700 px-1.5 py-1 align-middle bg-slate-50 font-bold text-center whitespace-pre-line";

export default function IncheonChecklistForm({ data }: { data: IncFormState }) {
  return (
    <div className="w-[840px] bg-white px-7 py-6 text-[11px] text-slate-900" style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', sans-serif" }}>
      <div className="mb-1 text-right text-[11px] font-bold text-slate-500">인천</div>

      <div className="mb-2 bg-[#22324a] py-2.5 text-center text-xl font-extrabold tracking-wide text-white">{INC_TITLE}</div>

      <Header data={data} />
      <p className="mb-2 text-center text-[11px]">
        <span className="mr-6">{fmtDate(data.installDate)}</span>
        <span className="font-bold">설치일과 체크리스트 확인일의 일치여부</span>를 확인합니다.
      </p>

      {/* 점검표 */}
      <table className="w-full border-collapse text-[9.5px] leading-tight">
        <thead>
          <tr>
            <th className={`${hd} w-[4%]`} colSpan={2}>케이스</th>
            <th className={`${hd} w-[12%]`}>{"점검대상\n단말기"}</th>
            <th className={`${hd} w-[11%]`}>점검항목</th>
            <th className={`${hd} w-[14.7%]`}>점검방법</th>
            <th className={`${hd} w-[32%]`}>점검POINT</th>
            <th className={`${hd} w-[6.3%]`}>{"O/X, 시간"}</th>
            <th className={`${hd} w-[10%]`}>비고</th>
          </tr>
        </thead>
        <tbody>
          {INC_ROWS.map((r, i) => (
            <tr key={i}>
              <Cell r={r} col="caseNo" cls={cMid}>{r.caseNo}</Cell>
              <Cell r={r} col="caseLabel" cls={`${cMid} whitespace-pre-line`}>{r.caseLabel}</Cell>
              <Cell r={r} col="target" cls={`${cMid} whitespace-pre-line`}>{r.target}</Cell>
              <Cell r={r} col="item" cls={`${c} whitespace-pre-line`}>{r.item}</Cell>
              <Cell r={r} col="method" cls={`${c} whitespace-pre-line`}>{r.method}</Cell>
              <Cell r={r} col="point" cls={`${c} whitespace-pre-line`}>{pointFor(r, data)}</Cell>
              <Cell r={r} col="ox" cls={`${cMid} font-bold`}>{oxFor(r, data)}</Cell>
              <Cell r={r} col="bigo" cls={`${c} whitespace-pre-line text-[9px] text-slate-500`}>{bigoFor(r, data)}</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 상단 헤더 (설치자 확인만, 운수사 서명 없음)
function Header({ data }: { data: IncFormState }) {
  const tri = (a: string, b: string, d: string) => `${a || ""} / ${b || ""} / ${d || ""}`;
  return (
    <table className="mb-2 w-full border-collapse text-[11px]">
      <tbody>
        <tr>
          <td className={`${labCell} w-[11%]`}>설치일</td>
          <td className={`${cMid} w-[18%]`}>{fmtDate(data.installDate)}</td>
          <td className={`${labCell} w-[16%]`}>운수사명 / 운수사ID</td>
          <td className={`${cMid} w-[19%]`}>{data.operatorName} / {data.operatorId}</td>
          <td className={`${labCell} w-[12%]`} rowSpan={2}>설치자 확인</td>
          <td className={cMid} rowSpan={2}><SealStack name={data.installerName} sig={data.installerSig} /></td>
        </tr>
        <tr>
          <td className={labCell}>설치시간</td>
          <td className={cMid}>{data.installTime}</td>
          <td className={labCell}>승.하차단말기 IH</td>
          <td className={cMid}>{tri(data.seungChaIH, data.hacha1IH, data.hacha2IH)}</td>
        </tr>
        <tr>
          <td className={`${labCell} whitespace-pre-line`}>노선번호{"\n"}차량번호</td>
          <td className={cMid}>{data.routeNo} / {data.vehicleNo}</td>
          <td className={labCell}>승.하차단말기(모듈) IH</td>
          <td className={cMid}>{tri(data.seungChaModuleIH, data.hacha1ModuleIH, data.hacha2ModuleIH)}</td>
          <td className={labCell}>표출단말기 IH</td>
          <td className={cMid}>{data.pyochulIH}</td>
        </tr>
        <tr>
          <td className={labCell}>LTE모뎀 IH</td>
          <td className={cMid}>{data.lteModemIH}</td>
          <td className={labCell}>AFC/BMS처리부,메인단말기 IH</td>
          <td className={cMid}>{data.mainIH}</td>
          <td className={labCell}>표출(모듈) IH</td>
          <td className={cMid}>{data.pyochulModuleIH}</td>
        </tr>
      </tbody>
    </table>
  );
}

function pointFor(r: IncRowDef, data: IncFormState): React.ReactNode {
  if (r.ox === "version") return `확인FW버전 [ ${data.fwVer || "     "} ]       /  확인OS버전 [ ${data.osVer || "     "} ]`;
  if (r.ox === "etc") return data.etcContent || "";
  return r.point;
}

function oxFor(r: IncRowDef, data: IncFormState): React.ReactNode {
  switch (r.ox) {
    case "vehicleType":
      return data.vehicleType ? data.vehicleType.slice(-1) : "";
    case "partition":
      return data.partition;
    case "time":
      return data.timeValue;
    case "check": {
      const key = r.checkKey!;
      if (r.na && data.naChecks[key]) return <span className="text-[8px] font-bold whitespace-normal leading-none">해당없음</span>;
      return data.checks[key] ? "○" : "";
    }
    default:
      return "";
  }
}

function bigoFor(r: IncRowDef, data: IncFormState): React.ReactNode {
  switch (r.bigoKind) {
    case "manufacturer":
      return `제조사 ${data.manufacturer}`;
    case "modelName":
      return `모델명 ${data.modelName}`;
    case "seat":
      return `좌석수 ${data.seatCount}`;
    case "etcQty":
      return `수량 ${data.etcQty}`;
    default:
      return r.bigo;
  }
}

// 원본 병합 반영 셀: r.m[col] 없으면 병합에 가려진 셀 → 렌더 안 함
function Cell({ r, col, cls, children }: { r: IncRowDef; col: CkCellKey; cls: string; children: React.ReactNode }) {
  const sp = r.m?.[col];
  if (!sp) return null;
  return (
    <td className={cls} rowSpan={sp[0]} colSpan={sp[1]}>
      {children}
    </td>
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
