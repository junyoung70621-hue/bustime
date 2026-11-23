import PasswordLogin from "@/components/PasswordLogin";

// middleware 가 대폐차 페이지 미인증 시 여기로 보냄 (?next=원래 경로)
export default function FieldLogin({ searchParams }: { searchParams: { next?: string } }) {
  const n = searchParams.next ?? "";
  const next = n.startsWith("/") && !n.startsWith("//") ? n : "/daepyecha"; // 외부 리다이렉트 차단
  return <PasswordLogin title="대폐차 로그인" endpoint="/api/field/login" next={next} placeholder="현장 공용 비밀번호" />;
}
