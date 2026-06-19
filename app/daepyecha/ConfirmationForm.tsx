"use client";

// ─────────────────────────────────────────────────────────────
// A4 자재 지급확인서 양식 (미리보기 + PDF 캡처 공용)
//   원본 엑셀 양식 재현: 남색 제목 바 + 4열 표(NO·품목·수량(신규/재활용)·비고).
//   고정 폭 794px(A4 @96dpi).
//   ※ html2canvas 안정성: flex `gap`/`absolute`/`justify-between` 미사용
//      → 레이아웃은 table + inline-block + margin 으로만 구성.
// ─────────────────────────────────────────────────────────────
import type { FormState } from "@/lib/daepyecha/types";

const td = "border border-slate-800 px-2 py-1 align-middle";
const th = "border border-slate-800 px-1 py-1 bg-slate-100 font-bold text-center";

export default function ConfirmationForm({ data, centerSuffix = "센터" }: { data: FormState; centerSuffix?: string }) {
  const title = data.tagless
    ? "태그리스 설치 자재 지급확인서"
    : data.model
      ? `${data.model} 설치 자재 지급확인서`
      : "설치 자재 지급확인서";
  const purposeText = data.tagless ? `${data.purpose}(태그리스)` : data.purpose;
  return (
    <div
      className="w-[794px] bg-white px-10 py-8 text-[13px] text-slate-900"
      style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}
    >
      {data.center ? (
        <div className="mb-1 text-right text-[12px] font-bold text-slate-500">{data.center}{centerSuffix}</div>
      ) : null}

      {/* 제목 바(원본: 남색 배경 흰 글씨) */}
      <div className="mb-5 bg-[#22324a] py-3 text-center text-xl font-extrabold tracking-wide text-white">
        {title}
      </div>

      <div className="mb-1.5 text-[14px]">
        <span className="font-bold">1. 운수사 :</span> {data.operator || ""}
        {data.operator && data.officeType ? ` ${data.officeType}` : ""}
      </div>
      <div className="mb-1.5 text-[14px]">
        <span className="font-bold">2. 용　도 :</span>　{purposeText}
      </div>
      <div className="mb-1.5 text-[14px]">
        <span className="font-bold">3. 차량번호 :</span> {data.vehicleNumbers || ""}
      </div>
      <div className="mb-1.5 text-[14px] font-bold">4. 품　목</div>

      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className={`${th} w-[8%]`}>NO</th>
            <th className={`${th} w-[38%]`}>품　목</th>
            <th className={`${th} w-[10%]`}>수　량</th>
            <th className={`${th} w-[16%]`}>신규/재활용</th>
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
                <NewReusedCell hasNewReused={it.hasNewReused} newReused={it.newReused} />
              </td>
              <td className={`${td} text-[11px]`}>{it.bigo}</td>
            </tr>
          ))}
          {/* 기타 (선택 입력) */}
          <tr>
            <td className={`${td} text-center`}>{data.items.length + 1}</td>
            <td className={td}>기타</td>
            <td className={`${td} text-center`}></td>
            <td className={`${td} text-center`}></td>
            <td className={`${td} text-[11px]`}>{data.etc || ""}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-5 text-[14px] font-bold">5. 기타사항</div>
      <p className="mt-3 pl-6 text-[14px]">* 상기 수량에 대해 인수했음을 확인함.</p>
      <p className="mt-4 pl-6 text-[14px]">
        <span className="font-bold">* 지급 날짜 :</span> {formatDate(data.issuedDate)}
      </p>

      {/* 인수자/인계자 확인 — 우측 정렬(원본) */}
      <div className="mt-6 text-right">
        <SignLine label="* 인수자 확인 :" name={data.receiverName} sig={data.receiverSig} />
        <div className="h-3" />
        <SignLine label="* 인계자 확인 :" name={data.transferorName} sig={data.transferorSig} />
      </div>

      {/* 하단 로고 — 2열 테이블(원본 엑셀: 티머니 / ATEC mobility) */}
      <table className="mt-10 w-full">
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

/** 신규/재활용 셀: 해당 품목만 "신규 / 재활용" 표기(선택값 강조) */
function NewReusedCell({
  hasNewReused,
  newReused,
}: {
  hasNewReused: boolean;
  newReused: "신규" | "재활용" | null;
}) {
  if (!hasNewReused) return null;
  return (
    <span className="text-[11px]">
      <span className={newReused === "신규" ? "font-extrabold text-slate-900" : "text-slate-300"}>
        신규
      </span>
      {" / "}
      <span className={newReused === "재활용" ? "font-extrabold text-slate-900" : "text-slate-300"}>
        재활용
      </span>
    </span>
  );
}

function SignLine({ label, name, sig }: { label: string; name: string; sig: string | null }) {
  return (
    <div className="whitespace-nowrap text-[14px]">
      <span className="align-middle font-bold">{label}</span>{" "}
      <span className="inline-block min-w-[90px] border-b border-slate-500 px-2 text-center align-middle font-bold">
        {name || "　"}
      </span>{" "}
      <span
        className="inline-block text-center align-middle"
        style={{ width: 100, height: 40, lineHeight: "40px" }}
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
      <span className="align-middle font-bold">(인)</span>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "20      년      월      일";
  const [y, m, day] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
}
