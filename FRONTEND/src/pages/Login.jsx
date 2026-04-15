import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { login } from "../services/authService";
import AuthLayout from "../components/auth/AuthLayout.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const n = sessionStorage.getItem("officeMealFlashNotice");
    if (n) {
      setNotice(n);
      sessionStorage.removeItem("officeMealFlashNotice");
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const email = form.email.trim();
    const password = form.password.trim();
    if (!email || !password) {
      setError("Vui Lòng Nhập Đủ Email Và Mật Khẩu.");
      return;
    }
    try {
      await login({ email, password });
      sessionStorage.setItem("officeMealFlashNotice", "Đăng Nhập Thành Công.");
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng Nhập Thất Bại.");
    }
  };

  return (
    <AuthLayout
      title="Đăng Nhập"
      subtitle="Đăng Nhập Để Đặt Cơm Văn Phòng Nhanh Chóng, Theo Dõi Đơn Mọi Lúc."
      footer={
        <p className="auth-shell__switch mb-0">
          Chưa Có Tài Khoản?{" "}
          <Link to="/register" className="auth-shell__switch-link">
            Đăng Ký Ngay
          </Link>
        </p>
      }
    >
      <form className="auth-shell__form" onSubmit={handleSubmit} noValidate>
        {notice && <div className="auth-shell__notice">{notice}</div>}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="login-email">
            Email
          </label>
          <div className="auth-field__control">
            <Mail className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="login-email"
              className="form-control auth-field__input"
              type="email"
              autoComplete="email"
              placeholder="Email@CongTy.com"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="login-password">
            Mật Khẩu
          </label>
          <div className="auth-field__control">
            <Lock className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="login-password"
              type="password"
              className="form-control auth-field__input"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
        </div>

        {error && <div className="auth-shell__error">{error}</div>}

        <button className="btn btn-brand auth-shell__submit w-100" type="submit">
          Đăng Nhập
        </button>
      </form>
    </AuthLayout>
  );
}
