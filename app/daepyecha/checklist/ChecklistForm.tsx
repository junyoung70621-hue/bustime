"use client";

// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트 A4 양식 (미리보기 + PDF 캡처 공용)
//   본문은 선택한 모델(CK_MODELS_DATA[model])의 행을 그대로 렌더 — 모델별 상이.
//   8열: 번호·케이스명·점검대상·점검항목·점검방법(아이콘)·점검POINT·O/X시간·비고
//   html2canvas 안전: table + rowspan + inline-block.
// ─────────────────────────────────────────────────────────────
import { CK_MODELS_DATA, rowCheckKey, modelFamily, hasSeunghacha, hasSeunghachaModule } from "@/lib/checklist/templates";
import type { CkFormState, CkRowDef, CkCellKey } from "@/lib/checklist/types";

const c = "border border-slate-700 px-1.5 py-1 align-middle";
const cMid = "border border-slate-700 px-1.5 py-1 align-middle text-center";
const hd = "border border-slate-700 px-1 py-1 bg-slate-100 text-center font-bold whitespace-pre-line";
const labCell = "border border-slate-700 px-1.5 py-1 align-middle bg-slate-50 font-bold text-center";

export default function ChecklistForm({ data }: { data: CkFormState }) {
  const def = data.model ? CK_MODELS_DATA[data.model] : undefined;
  const title = def?.title ?? `${data.model || ""} 단말기 체크 리스트`;
  const rows: CkRowDef[] = def?.rows ?? [];

  return (
    <div className="w-[840px] bg-white px-7 py-6 text-[11px] text-slate-900" style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', sans-serif" }}>
      {data.center ? <div className="mb-1 text-right text-[11px] font-bold text-slate-500">{data.center}센터</div> : null}

      <div className="mb-2 bg-[#22324a] py-2.5 text-center text-xl font-extrabold tracking-wide text-white">{title}</div>

      {/* 상단 헤더 (계열별) */}
      {modelFamily(data.model) === "pyochul" ? (
        <PyochulHeader data={data} />
      ) : (
        <DriverHeader data={data} />
      )}
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
            <th className={`${hd} w-[30%]`}>점검POINT</th>
            <th className={`${hd} w-[8%]`}>{"O/X, 시간"}</th>
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
              <Cell r={r} col="method" cls={`${c} whitespace-pre-line`}>
                {r.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.icon} alt="" className="inline-block h-5 w-auto align-middle" />
                ) : (
                  methodFor(r)
                )}
              </Cell>
              <Cell r={r} col="point" cls={`${c} whitespace-pre-line`}>{pointFor(r, data)}</Cell>
              <Cell r={r} col="ox" cls={`${cMid} font-bold`}>{oxFor(r, data, i)}</Cell>
              <Cell r={r} col="bigo" cls={`${c} whitespace-pre-line text-[9px] text-slate-500`}>{bigoFor(r, data)}</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function methodFor(r: CkRowDef): React.ReactNode {
  if (r.kind === "version") return "버전 최신여부 확인";
  return r.method;
}

function pointFor(r: CkRowDef, data: CkFormState): React.ReactNode {
  if (r.kind === "version") return `FW버전 [ ${data.fwVer || "-"} ]  OS버전 [ ${data.osVer || "-"} ]`;
  if (r.kind === "etc") return data.etcContent || r.point;
  return r.point;
}

function oxFor(r: CkRowDef, data: CkFormState, i: number): React.ReactNode {
  switch (r.kind) {
    case "vehicleType":
      return data.vehicleType ? data.vehicleType.slice(-1) : "";
    case "partition":
      return data.partition;
    case "time":
      return data.timeValue;
    case "installer":
      return <span className="font-bold">설치자 확인</span>;
    case "check":
      return data.checks[rowCheckKey(data.model, i)] ? "○" : "";
    default:
      return "";
  }
}

function bigoFor(r: CkRowDef, data: CkFormState): React.ReactNode {
  if (r.kind === "installer") return <SealStack name={data.installerName} sig={data.installerSig} />;
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
function Cell({
  r,
  col,
  cls,
  children,
}: {
  r: CkRowDef;
  col: CkCellKey;
  cls: string;
  children: React.ReactNode;
}) {
  const sp = r.m?.[col];
  if (!sp) return null;
  return (
    <td className={cls} rowSpan={sp[0]} colSpan={sp[1]}>
      {children}
    </td>
  );
}

// 표출단말기 계열 헤더 (B700/B710/B800)
//   B700: 표출IH/표출모듈 한 칸 + CITS 처리부 별도
//   B710/B800: 표출단말기 IH / 표출(모듈) IH 를 각 행에 따로, CITS 없음
function PyochulHeader({ data }: { data: CkFormState }) {
  const hasCits = data.model === "B700";
  const hasMod = hasSeunghachaModule(data.model);
  return (
    <table className="mb-2 w-full border-collapse text-[11px]">
      <tbody>
        <tr>
          <td className={`${labCell} w-[11%]`}>설치일</td>
          <td className={`${cMid} w-[18%]`}>{fmtDate(data.installDate)}</td>
          <td className={`${labCell} w-[15%]`}>운수사명 / 운수사ID</td>
          <td className={`${cMid} w-[20%]`}>{data.operatorName} / {data.operatorId}</td>
          <td className={`${labCell} w-[12%]`} rowSpan={2}>운수사 확인</td>
          <td className={cMid} rowSpan={2}><SealStack name={data.operatorSignerName} sig={data.operatorSig} /></td>
        </tr>
        <tr>
          <td className={labCell}>설치시간</td>
          <td className={cMid}>{data.installTime}</td>
          <td className={labCell}>승.하차단말기 IH</td>
          <td className={cMid}>{data.seungChaIH} / {data.hacha1IH} / {data.hacha2IH}</td>
        </tr>
        <tr>
          <td className={`${labCell} whitespace-pre-line`}>노선번호{"\n"}차량번호</td>
          <td className={cMid}>{data.routeNo} / {data.vehicleNo}</td>
          {hasMod ? (
            <>
              <td className={labCell}>승.하차단말기(모듈) IH</td>
              <td className={cMid}>{data.seungChaModuleIH} / {data.hacha1ModuleIH} / {data.hacha2ModuleIH}</td>
            </>
          ) : (
            <>
              <td className={labCell} />
              <td className={cMid} />
            </>
          )}
          {hasCits ? (
            <>
              <td className={`${labCell} whitespace-pre-line`}>표출단말기 IH{"\n"}표출(모듈) IH</td>
              <td className={`${cMid} whitespace-pre-line`}>{data.pyochulIH}{"\n"}{data.pyochulModuleIH}</td>
            </>
          ) : (
            <>
              <td className={labCell}>표출단말기 IH</td>
              <td className={cMid}>{data.pyochulIH}</td>
            </>
          )}
        </tr>
        <tr>
          <td className={labCell}>LTE모뎀 IH</td>
          <td className={cMid}>{data.lteModemIH}</td>
          <td className={labCell}>AFC/BMS처리부,메인단말기 IH</td>
          <td className={cMid}>{data.mainIH}</td>
          {hasCits ? (
            <>
              <td className={labCell}>CITS 처리부 IH</td>
              <td className={cMid}>{data.citsIH}</td>
            </>
          ) : (
            <>
              <td className={labCell}>표출(모듈) IH</td>
              <td className={cMid}>{data.pyochulModuleIH}</td>
            </>
          )}
        </tr>
      </tbody>
    </table>
  );
}

// 운전자단말기 계열 헤더 (B600/B620/B620한강셔틀)
function DriverHeader({ data }: { data: CkFormState }) {
  const seung = hasSeunghacha(data.model);
  return (
    <table className="mb-2 w-full border-collapse text-[11px]">
      <tbody>
        <tr>
          <td className={`${labCell} w-[12%]`}>설치일</td>
          <td className={`${cMid} w-[22%]`}>{fmtDate(data.installDate)}</td>
          <td className={`${labCell} w-[14%]`}>운수사명</td>
          <td className={`${cMid} w-[20%]`}>{data.operatorName}</td>
          <td className={`${labCell} w-[12%]`} rowSpan={2}>운수사 확인</td>
          <td className={cMid} rowSpan={2}><SealStack name={data.operatorSignerName} sig={data.operatorSig} /></td>
        </tr>
        <tr>
          <td className={labCell}>설치시간</td>
          <td className={cMid}>{data.installTime}</td>
          <td className={labCell}>운수사ID</td>
          <td className={cMid}>{data.operatorId}</td>
        </tr>
        <tr>
          <td className={`${labCell} whitespace-pre-line`}>노선번호{"\n"}차량번호</td>
          <td className={cMid}>{data.routeNo} / {data.vehicleNo}</td>
          {seung ? (
            <>
              <td className={labCell}>승.하차단말기 IH</td>
              <td className={cMid}>{data.seungChaIH} / {data.hacha1IH} / {data.hacha2IH}</td>
              <td className={labCell}>운전자단말기 IH</td>
              <td className={cMid}>{data.driverIH}</td>
            </>
          ) : (
            <>
              <td className={labCell}>운전자단말기 IH</td>
              <td className={cMid} colSpan={3}>{data.driverIH}</td>
            </>
          )}
        </tr>
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
