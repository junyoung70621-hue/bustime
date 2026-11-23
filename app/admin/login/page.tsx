import PasswordLogin from "@/components/PasswordLogin";

export default function AdminLogin() {
  return <PasswordLogin title="관리자 로그인" endpoint="/api/admin/login" next="/admin" placeholder="관리자 비밀번호" />;
}
