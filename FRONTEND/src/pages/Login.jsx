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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgotHint, setForgotHint] = useState(false);

  useEffect(() => {
    const n = sessionStorage.getItem("officeMealFlashNotice");
    if (n) {
      setNotice(n);
      sessionStorage.removeItem("officeMealFlashNotice");
    }
    try {
      const saved = localStorage.getItem("officeMealRememberEmail");
      if (saved) {
        setForm((s) => ({ ...s, email: saved }));
        setRemember(true);
      }
    } catch {
      /* ignore */
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
      if (remember) {
        try {
          localStorage.setItem("officeMealRememberEmail", email);
        } catch {
          /* ignore */
        }
      } else {
        try {
          localStorage.removeItem("officeMealRememberEmail");
        } catch {
          /* ignore */
        }
      }
      sessionStorage.setItem("officeMealFlashNotice", "Đăng Nhập Thành Công.");
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng Nhập Thất Bại.");
    }
  };

  return (
    <AuthLayout
      formTitle="Đăng Nhập"
      formSubtitle="Nhập Thông Tin Tài Khoản Để Tiếp Tục Đặt Món."
      welcomeTagline="Đặt Cơm Văn Phòng Nhanh Chóng, Chuẩn Vị Mỗi Ngày — Giao Tận Nơi Làm Việc."
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
          <div className="auth-field__control auth-field__control--with-toggle">
            <Lock className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="form-control auth-field__input auth-field__input--toggle"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              required
              minLength={6}
            />
            <button
              type="button"
              className="auth-field__show-btn"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <div className="auth-split__row-between">
          <label className="auth-split__check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Ghi Nhớ Đăng Nhập</span>
          </label>
          <button type="button" className="auth-split__link-btn" onClick={() => setForgotHint(true)}>
            Quên Mật Khẩu?
          </button>
        </div>
        {forgotHint && (
          <p className="auth-split__hint small mb-0">Vui Lòng Liên Hệ Quản Trị Viên Để Đặt Lại Mật Khẩu.</p>
        )}

        {error && <div className="auth-shell__error">{error}</div>}

        <button className="btn auth-split__submit w-100" type="submit">
          Đăng Nhập
        </button>
      </form>
    </AuthLayout>
  );
}
