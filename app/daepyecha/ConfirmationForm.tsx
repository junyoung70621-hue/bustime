"use client";

// ─────────────────────────────────────────────────────────────
// A4 자재 지급확인서 양식 (미리보기 + PDF 캡처 공용)
//   고정 폭 794px(A4 @96dpi). html2canvas 안전을 위해 box-shadow/gradient 미사용.
//   같은 컴포넌트를 화면 미리보기와 PDF 캡처에 모두 사용 → 미리보기 = PDF.
// ─────────────────────────────────────────────────────────────
import type { FormState } from "@/lib/daepyecha/types";

const td = "border border-slate-700 px-2 py-1 align-middle";
const th = "border border-slate-700 px-2 py-1 bg-slate-100 font-bold text-center";

export default function ConfirmationForm({ data }: { data: FormState }) {
  const title = data.model ? `${data.model} 설치 자재 지급확인서` : "설치 자재 지급확인서";
  return (
    <div
      className="w-[794px] bg-white p-10 text-[13px] leading-relaxed text-slate-900"
      style={{ fontFamily: "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}
    >
      <h1 className="mb-5 text-center text-2xl font-extrabold tracking-wide">{title}</h1>

      <div className="mb-2 flex flex-col gap-1 text-[14px]">
        <div>
          <span className="font-bold">1. 운수사 :</span> {data.operator || ""}
        </div>
        <div>
          <span className="font-bold">2. 용　도 :</span> 대폐차
        </div>
        <div>
          <span className="font-bold">3. 차량번호 :</span> {data.vehicleNumbers || ""}
        </div>
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
        </tbody>
      </table>

      <p className="mt-4 text-[13px]">* 상기 수량에 대해 인수했음을 확인함.</p>

      <div className="mt-6 flex items-end justify-between text-[14px]">
        <div className="flex flex-col gap-6">
          <SignLine label="* 인수자 확인 (운수회사) :" name={data.receiverName} sig={data.receiverSig} />
          <SignLine label="* 인계자 확인 (자사 직원) :" name={data.transferorName} sig={data.transferorSig} />
        </div>
        <div className="text-right text-[13px]">
          <p>* 지급 날짜</p>
          <p className="mt-1 font-bold">{formatDate(data.issuedDate)}</p>
          <p className="mt-4 text-[12px] text-slate-500">센터: {data.center}</p>
        </div>
      </div>
    </div>
  );
}

function SignLine({ label, name, sig }: { label: string; name: string; sig: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-bold">{label}</span>
      <span className="min-w-[80px] border-b border-slate-500 px-2 text-center">{name || " "}</span>
      <span className="relative inline-flex h-12 w-28 items-center justify-center">
        {sig ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sig} alt="서명" className="max-h-12 max-w-28 object-contain" />
        ) : null}
        <span className="absolute bottom-0 right-0 text-[12px]">(인)</span>
      </span>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "20      년      월      일";
  const [y, m, day] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
}
