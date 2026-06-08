"use client";

// ─────────────────────────────────────────────────────────────
// A4 자재 지급확인서 양식 (미리보기 + PDF 캡처 공용)
//   고정 폭 794px(A4 @96dpi).
//   ※ html2canvas 안정성: flex `gap`/`absolute`/`justify-between` 미사용
//      → 레이아웃은 table + inline-block + margin 으로만 구성.
// ─────────────────────────────────────────────────────────────
import type { FormState } from "@/lib/daepyecha/types";

const td = "border border-slate-700 px-2 py-1 align-middle";
const th = "border border-slate-700 px-2 py-1 bg-slate-100 font-bold text-center";

export default function ConfirmationForm({ data }: { data: FormState }) {
  const title = data.model ? `${data.model} 설치 자재 지급확인서` : "설치 자재 지급확인서";
  return (
    <div
      className="w-[794px] bg-white p-10 text-[13px] text-slate-900"
      style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}
    >
      <div className="mb-1 text-right text-[12px] font-bold text-slate-600">
        {data.center ? `${data.center}센터` : ""}
      </div>
      <h1 className="mb-5 text-center text-2xl font-extrabold">{title}</h1>

      <div className="mb-1 text-[14px]">
        <span className="font-bold">1. 운수사 :</span> {data.operator || ""}
        {data.operator && data.officeType ? ` (${data.officeType})` : ""}
      </div>
      <div className="mb-1 text-[14px]">
        <span className="font-bold">2. 용　도 :</span> {data.purpose}
      </div>
      <div className="mb-3 text-[14px]">
        <span className="font-bold">3. 차량번호 :</span> {data.vehicleNumbers || ""}
      </div>

      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className={`${th} w-[8%]`}>NO</th>
            <th className={`${th} w-[40%]`}>품　목</th>
            <th className={`${th} w-[10%]`}>수　량</th>
            <th className={`${th} w-[14%]`}>구분</th>
            <th className={`${th} w-[28%]`}>비　고</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i}>
              <td className={`${td} text-center`}>{i + 1}</td>
              <td className={td}>{it.name}</td>
              <td className={`${td} text-center font-bold`}>{it.qty || ""}</td>
              <td className={`${td} text-center`}>
                {it.hasNewReused ? (
                  <span>
                    <span className={it.newReused === "신규" ? "font-extrabold" : "text-slate-300"}>신규</span>
                    {" / "}
                    <span className={it.newReused === "재활용" ? "font-extrabold" : "text-slate-300"}>재활용</span>
                  </span>
                ) : (
                  ""
                )}
              </td>
              <td className={`${td} text-[11px]`}>{it.bigo}</td>
            </tr>
          ))}
          {/* 13. 기타 (선택 입력) */}
          <tr>
            <td className={`${td} text-center`}>{data.items.length + 1}</td>
            <td className={td}>기타</td>
            <td className={`${td} text-center`}></td>
            <td className={`${td} text-center`}></td>
            <td className={`${td} text-[11px]`}>{data.etc || ""}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-5 text-[14px]">* 상기 수량에 대해 인수했음을 확인함.</p>
      <p className="mt-4 text-[14px]">
        <span className="font-bold">* 지급 날짜 :</span> {formatDate(data.issuedDate)}
      </p>
      <div className="mt-3">
        <SignLine label="* 인수자 확인 :" name={data.receiverName} sig={data.receiverSig} />
      </div>
      <div className="mt-2">
        <SignLine label="* 인계자 확인 :" name={data.transferorName} sig={data.transferorSig} />
      </div>

      {/* 하단 로고 — 2열 테이블(원본 엑셀: 티머니 / ATEC mobility) */}
      <table className="mt-8 w-full border-t border-slate-200">
        <tbody>
          <tr>
            <td className="pt-4 text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tmoney-logo.png" alt="티머니" className="inline-block h-9 w-auto" />
            </td>
            <td className="pt-4 text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/atec-mobility.png" alt="ATEC mobility" className="inline-block h-5 w-auto" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SignLine({ label, name, sig }: { label: string; name: string; sig: string | null }) {
  return (
    <div className="mb-6 whitespace-nowrap">
      <span className="align-middle font-bold">{label}</span>{" "}
      <span className="inline-block min-w-[80px] border-b border-slate-500 px-2 text-center align-middle font-bold">
        {name || "　"}
      </span>{" "}
      <span
        className="inline-block text-right align-middle"
        style={{ width: 110, height: 40, lineHeight: "40px" }}
      >
        {sig ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sig}
            alt="서명"
            className="inline-block align-middle"
            style={{ maxHeight: 38, maxWidth: 90 }}
          />
        ) : null}
      </span>{" "}
      <span className="align-middle text-[12px]">(인)</span>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "20      년      월      일";
  const [y, m, day] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
}
