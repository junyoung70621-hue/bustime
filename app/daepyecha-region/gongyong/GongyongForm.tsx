"use client";

// ─────────────────────────────────────────────────────────────
// 공용 설치확인서 A4 양식 (미리보기 + PDF 캡처 공용)
//   엑셀 "공용 설치확인서.xlsx" 재현 — 다차량 표 1장.
//   html2canvas 안전: table + rowspan/colspan, flex gap 미사용.
// ─────────────────────────────────────────────────────────────
import type { GongyongForm, GongyongBusType } from "@/lib/gongyong/types";
import { GONGYONG_BUS_TYPES } from "@/lib/gongyong/templates";

const c = "border border-slate-700 px-1.5 py-1 align-middle";
const cMid = "border border-slate-700 px-1.5 py-1 align-middle text-center";
const lab = "border border-slate-700 px-1.5 py-1 align-middle bg-slate-50 font-bold text-center";
const hd = "border border-slate-700 px-1 py-1 bg-slate-100 text-center font-bold whitespace-pre-line";

const chk = (on: boolean) => (on ? "☑" : "□");

export default function GongyongForm({ data }: { data: GongyongForm }) {
  if (data.region === "포항") return <PohangForm data={data} />;
  const busTypes: GongyongBusType[] = GONGYONG_BUS_TYPES;
  return (
    <div className="w-[840px] bg-white px-7 py-6 text-[11px] text-slate-900" style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', sans-serif" }}>
      {data.region ? <div className="mb-1 text-right text-[11px] font-bold text-slate-500">{data.region}</div> : null}

      <div className="mb-2 bg-[#22324a] py-2.5 text-center text-xl font-extrabold tracking-wide text-white">설치 확인서</div>

      <div className="mb-2 text-[12px] font-bold">■ 설치확인일자 : {fmtDate(data.installDate)}</div>

      {/* 헤더 정보 */}
      <table className="mb-2 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className={`${lab} w-[12%]`}>버스 구분</td>
            <td className={`${c} w-[38%]`}>
              {busTypes.map((b) => (
                <span key={b} className="mr-2 whitespace-nowrap">{chk(data.busType === b)} {b}</span>
              ))}
            </td>
            <td className={`${lab} w-[14%]`} rowSpan={3}>※ 고객 요청 사항</td>
            <td className={`${c} whitespace-pre-line align-top`} rowSpan={3}>{data.customerRequest}</td>
          </tr>
          <tr>
            <td className={lab}>운수사명</td>
            <td className={c}>{data.operatorName}{data.officeType ? ` (${data.officeType})` : " ( 본사, 영업소 )"}</td>
          </tr>
          <tr>
            <td className={lab}>설치구분</td>
            <td className={c}>{chk(data.installType === "증차")} 증차　　{chk(data.installType === "대폐차")} 대폐차</td>
          </tr>
          <tr>
            <td className={lab}>주 소</td>
            <td className={c}>{data.address}</td>
            <td className={lab} rowSpan={3}>※ 기타 사항</td>
            <td className={`${c} whitespace-pre-line align-top`} rowSpan={3}>{data.etc}</td>
          </tr>
          <tr>
            <td className={lab}>전화번호</td>
            <td className={c}>{data.phone}</td>
          </tr>
          <tr>
            <td className={lab}>노선구분</td>
            <td className={c}>{data.routeType}</td>
          </tr>
        </tbody>
      </table>

      {/* 차량 표 */}
      <table className="w-full border-collapse text-[9.5px] leading-tight">
        <thead>
          <tr>
            <th className={`${hd} w-[5%]`} rowSpan={2}>NO</th>
            <th className={`${hd} w-[13%]`} rowSpan={2}>차량번호</th>
            <th className={`${hd} w-[15%]`} rowSpan={2}>{"운전자조작기\n(버스메인)"}</th>
            <th className={`${hd} w-[13%]`} rowSpan={2}>{"승하차단말기1\n(승하차전용)"}</th>
            <th className={`${hd} w-[13%]`} rowSpan={2}>{"승하차단말기2\n(승하차전용)"}</th>
            <th className={`${hd} w-[13%]`} rowSpan={2}>{"승하차단말기3\n(승하차전용)"}</th>
            <th className={hd} colSpan={2}>기타 소모 자재</th>
          </tr>
          <tr>
            <th className={`${hd} w-[8%]`}>{"GPS\n안테나"}</th>
            <th className={`${hd} w-[8%]`}>{"ㄷ자\n격벽용"}</th>
          </tr>
        </thead>
        <tbody>
          {data.vehicles.map((v, i) => (
            <tr key={i}>
              <td className={cMid}>{i + 1}</td>
              <td className={cMid}>{v.vehicleNo}</td>
              <td className={cMid}>{v.main}</td>
              <td className={cMid}>{v.sc1}</td>
              <td className={cMid}>{v.sc2}</td>
              <td className={cMid}>{v.sc3}</td>
              <td className={cMid}>{v.gpsAnt}</td>
              <td className={cMid}>{v.partition}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 고객 확인 */}
      <table className="mt-3 w-full border-collapse text-[10.5px]">
        <tbody>
          <tr>
            <td className={`${lab} w-[10%] whitespace-pre-line`}>{"고 객\n확 인"}</td>
            <td className={`${c} leading-relaxed`}>
              <p>1. 상기물품을 정히 확인하고, 인수하였으며 해당 단말기를 이상없이 설치하였음을 확인합니다.</p>
              <p>2. 상기물품을 운영함에 있어 분실시나 파손시 변상하겠음.</p>
              <div className="mt-4 text-right">
                <SignLine label="* 운수사 확인 :" name={data.operatorSignerName} sig={data.operatorSig} />
                <div className="h-2" />
                <SignLine label="* 설치자 확인 :" name={data.installerName} sig={data.installerSig} />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 하단 로고 (티머니 / ATEC mobility) */}
      <table className="mt-6 w-full">
        <tbody>
          <tr>
            <td className="text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tmoney-logo.png" alt="티머니" className="inline-block h-9 w-auto" />
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

// 포항 전용 양식 (설치/철수 확인서)
function PohangForm({ data }: { data: GongyongForm }) {
  const cheol = data.docType === "철수";
  const docWord = cheol ? "철수" : "설치";
  return (
    <div className="w-[840px] bg-white px-7 py-6 text-[11px] text-slate-900" style={{ fontFamily: "var(--font-noto), 'Malgun Gothic', sans-serif" }}>
      <div className="mb-1 text-right text-[11px] font-bold text-slate-500">포항</div>
      <div className="mb-2 bg-[#22324a] py-2.5 text-center text-xl font-extrabold tracking-wide text-white">{docWord} 확인서</div>
      <div className="mb-2 text-[12px] font-bold">■ {docWord}확인일자 : {fmtDate(data.installDate)}</div>

      <table className="mb-2 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className={`${lab} w-[12%]`}>지역 구분</td>
            <td className={`${c} w-[38%]`}>{chk(true)} 포항</td>
            <td className={`${lab} w-[14%]`} rowSpan={2}>※ 고객 요청 사항</td>
            <td className={`${c} whitespace-pre-line align-top`} rowSpan={2}>{data.customerRequest}</td>
          </tr>
          <tr>
            <td className={lab}>회사명</td>
            <td className={c}>{data.companyName}</td>
          </tr>
          <tr>
            <td className={lab}>영업소명</td>
            <td className={c}>{data.officeName}</td>
            <td className={lab} rowSpan={2}>※ 기타 사항</td>
            <td className={`${c} whitespace-pre-line align-top`} rowSpan={2}>{data.etc}</td>
          </tr>
          <tr>
            <td className={lab}>주 소</td>
            <td className={c}>{data.address}</td>
          </tr>
          <tr>
            <td className={lab}>전화번호</td>
            <td className={c}>{data.phone}</td>
            <td className={lab} rowSpan={2}>단말기구분</td>
            <td className={cMid} rowSpan={2}>{chk(data.newTerminal)} 신단말기</td>
          </tr>
          <tr>
            <td className={lab}>노선구분</td>
            <td className={c}>{data.routeType}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-[9.5px] leading-tight">
        <thead>
          <tr>
            <th className={`${hd} w-[5%]`}>NO</th>
            <th className={`${hd} w-[15%]`}>차량번호</th>
            <th className={`${hd} w-[18%]`}>{"운전자조작기\n(버스메인)"}</th>
            <th className={`${hd} w-[16%]`}>{"승하차단말기1\n(승하차전용)"}</th>
            <th className={`${hd} w-[16%]`}>{"승하차단말기2\n(승하차전용)"}</th>
            <th className={`${hd} w-[15%]`}>인터페이스</th>
            <th className={`${hd} w-[15%]`}>모뎀</th>
          </tr>
        </thead>
        <tbody>
          {data.vehicles.map((v, i) => (
            <tr key={i}>
              <td className={cMid}>{i + 1}</td>
              <td className={cMid}>{v.vehicleNo}</td>
              <td className={cMid}>{v.main}</td>
              <td className={cMid}>{v.sc1}</td>
              <td className={cMid}>{v.sc2}</td>
              <td className={cMid}>{v.iface}</td>
              <td className={cMid}>{v.modem}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 text-[10.5px] leading-relaxed">
        <p>1. 상기물품을 정히 확인하고, 인수하였으며 해당 단말기를 이상없이 {docWord} 하였음을 확인합니다.</p>
        {!cheol && <p>2. 상기물품을 보관함에 있어 분실시나 파손시 변상하겠음.</p>}
      </div>

      <table className="mt-4 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className="w-1/2 py-1 text-center align-bottom"><SignLine label="담당자 확인 :" name={data.installerName} sig={data.installerSig} /></td>
            <td className="w-1/2 py-1 text-center align-bottom"><SignLine label="운수사 확인 :" name={data.operatorSignerName} sig={data.operatorSig} /></td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3 text-[10px] font-semibold text-slate-500">TEL : (02)2063-3220　FAX : (02)2063-3810</div>

      {/* 하단 로고 (티머니) — 오른쪽 아래 */}
      <div className="mt-3 text-right">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tmoney-logo.png" alt="티머니" className="inline-block h-9 w-auto" />
      </div>
    </div>
  );
}

function SignLine({ label, name, sig }: { label: string; name: string; sig: string | null }) {
  return (
    <div className="whitespace-nowrap text-[11px]">
      <span className="align-middle font-bold">{label}</span>{" "}
      <span className="inline-block min-w-[80px] border-b border-slate-500 px-2 text-center align-middle font-bold">{name || "　"}</span>{" "}
      <span className="inline-block text-center align-middle" style={{ width: 90, height: 30, lineHeight: "30px" }}>
        {sig ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sig} alt="서명" className="inline-block align-middle" style={{ maxHeight: 28, maxWidth: 80 }} />
        ) : null}
      </span>{" "}
      <span className="align-middle font-bold">(인)</span>
    </div>
  );
}

function fmtDate(d: string): string {
  if (!d) return "20      .      .      .";
  const [y, m, day] = d.split("-");
  return `${y}. ${Number(m)}. ${Number(day)}.`;
}
