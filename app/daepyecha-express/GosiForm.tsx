"use client";

// ─────────────────────────────────────────────────────────────
// 고속/시외 증·대폐차 설치확인서 A4 양식 (미리보기 + PDF 캡처 공용)
//   워드 "고속_시외_설치확인서.doc" 재현 — 단일 차량 + 자재 체크표 + 양측 서명.
// ─────────────────────────────────────────────────────────────
import { GOSI_PURPOSES } from "@/lib/gosi/templates";
import type { GosiForm } from "@/lib/gosi/types";

const c = "border border-slate-700 px-2 py-1 align-middle";
const cMid = "border border-slate-700 px-2 py-1 align-middle text-center";
const lab = "border border-slate-700 px-2 py-1 align-middle bg-slate-50 font-bold text-center";
const hd = "border border-slate-700 px-1 py-1 bg-slate-100 text-center font-bold";

const chk = (on: boolean) => (on ? "☑" : "□");

export default function GosiForm({ data }: { data: GosiForm }) {
  return (
    <div className="w-[794px] bg-white px-10 py-8 text-[12px] text-slate-900" style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', sans-serif" }}>
      <div className="mb-4 bg-[#22324a] py-3 text-center text-xl font-extrabold tracking-wide text-white">증·대폐차 설치확인서</div>

      {/* 헤더 정보 */}
      <table className="mb-3 w-full border-collapse text-[12px]">
        <tbody>
          <tr>
            <td className={`${lab} w-[16%]`}>구 분</td>
            <td className={c} colSpan={3}>
              {GOSI_PURPOSES.map((p) => (
                <span key={p} className="mr-5 whitespace-nowrap">{chk(data.purpose === p)} {p}</span>
              ))}
            </td>
          </tr>
          <tr>
            <td className={lab}>요청일자</td>
            <td className={`${cMid} w-[34%]`}>{fmtDate(data.requestDate)}</td>
            <td className={`${lab} w-[16%]`}>설치일자</td>
            <td className={cMid}>{fmtDate(data.installDate)}</td>
          </tr>
          <tr>
            <td className={lab}>운수사명</td>
            <td className={cMid}>{data.operatorName}</td>
            <td className={lab}>차량번호</td>
            <td className={cMid}>{data.vehicleNo}</td>
          </tr>
          <tr>
            <td className={lab}>운전자IH</td>
            <td className={cMid}>{data.driverIH}</td>
            <td className={lab}>승하차IH</td>
            <td className={cMid}>{data.scIH}</td>
          </tr>
          <tr>
            <td className={lab}>영수증기 S/N</td>
            <td className={cMid}>{data.receiptSn}</td>
            <td className={lab}>바코드 S/N</td>
            <td className={cMid}>{data.barcodeSn}</td>
          </tr>
        </tbody>
      </table>

      {/* 자재 체크표 */}
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className={`${hd} w-[8%]`}>No</th>
            <th className={`${hd} w-[62%]`}>품　명</th>
            <th className={`${hd} w-[14%]`}>수량</th>
            <th className={`${hd} w-[16%]`}>완료여부</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i}>
              <td className={cMid}>{i + 1}</td>
              <td className={c}>{it.name}</td>
              <td className={cMid}>{it.qty}</td>
              <td className={`${cMid} font-bold`}>{it.done ? "○" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 text-center text-[13px] font-bold">상기와 같이 이상 없이 설치되었음을 확인합니다.</p>
      <p className="mt-2 text-center text-[13px]">{fmtDateLong(data.confirmDate)}</p>

      {/* 서명 */}
      <table className="mx-auto mt-5 w-[80%] border-collapse text-[12px]">
        <tbody>
          <tr>
            <td className={`${lab} w-[20%]`}>소　속</td>
            <td className={`${cMid} w-[40%]`}>티머니</td>
            <td className={cMid}>{data.operatorName || "고속사명"}</td>
          </tr>
          <tr>
            <td className={lab}>성명/서명</td>
            <td className={cMid}><SignBox name={data.tmoneyName} sig={data.tmoneySig} /></td>
            <td className={cMid}><SignBox sig={data.operatorSig} hint="(직인 또는 서명날인)" /></td>
          </tr>
        </tbody>
      </table>

      {/* 하단 로고 (티머니 / ATEC mobility) */}
      <table className="mt-8 w-full">
        <tbody>
          <tr>
            <td className="text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tmoney-logo.png" alt="티머니" className="inline-block h-10 w-auto" />
            </td>
            <td className="text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/atec-mobility.png" alt="ATEC mobility" className="inline-block h-6 w-auto" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SignBox({ name, sig, hint }: { name?: string; sig: string | null; hint?: string }) {
  return (
    <div className="text-center leading-tight">
      {name ? <div className="mb-0.5 font-bold">{name}</div> : null}
      <div style={{ height: 30 }}>
        {sig ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sig} alt="서명" className="inline-block align-middle" style={{ maxHeight: 30, maxWidth: 110 }} />
        ) : null}
      </div>
      {hint ? <div className="text-[9px] text-slate-400">{hint}</div> : null}
    </div>
  );
}

function fmtDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y}. ${Number(m)}. ${Number(day)}.`;
}
function fmtDateLong(d: string): string {
  if (!d) return "년    월    일";
  const [y, m, day] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
}
