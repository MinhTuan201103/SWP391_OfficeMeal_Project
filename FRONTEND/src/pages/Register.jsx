import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Lock, UserRound } from "lucide-react";
import { register } from "../services/authService";
import AuthLayout from "../components/auth/AuthLayout.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password.trim()
    };
    if (!payload.fullName || !payload.email || !payload.phone || !payload.password) {
      setError("Vui Lòng Nhập Đủ Thông Tin.");
      return;
    }
    try {
      await register(payload);
      sessionStorage.setItem("officeMealFlashNotice", "Đăng Ký Thành Công. Vui Lòng Đăng Nhập.");
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng Ký Thất Bại.");
    }
  };

  return (
    <AuthLayout
      formTitle="Đăng Ký"
      formSubtitle="Tạo Tài Khoản Khách Hàng Để Đặt Món Và Theo Dõi Đơn Hàng."
      welcomeTagline="Tham Gia Cùng Hàng Ngàn Khách Hàng Tin Dùng OfficeMeal Mỗi Ngày."
      footer={
        <p className="auth-shell__switch mb-0">
          Đã Có Tài Khoản?{" "}
          <Link to="/login" className="auth-shell__switch-link">
            Đăng Nhập
          </Link>
        </p>
      }
    >
      <form className="auth-shell__form auth-shell__form--scroll" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="reg-name">
            Họ Và Tên
          </label>
          <div className="auth-field__control">
            <UserRound className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="reg-name"
              className="form-control auth-field__input"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
              required
              minLength={2}
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="reg-email">
            Email
          </label>
          <div className="auth-field__control">
            <Mail className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="reg-email"
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
          <label className="auth-field__label" htmlFor="reg-phone">
            Số Điện Thoại
          </label>
          <div className="auth-field__control">
            <Phone className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="reg-phone"
              className="form-control auth-field__input"
              autoComplete="tel"
              placeholder="09xx xxx xxx"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              required
              minLength={9}
              maxLength={20}
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="reg-password">
            Mật Khẩu
          </label>
          <div className="auth-field__control auth-field__control--with-toggle">
            <Lock className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              className="form-control auth-field__input auth-field__input--toggle"
              autoComplete="new-password"
              placeholder="Tối Thiểu 6 Ký Tự"
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

        {error && <div className="auth-shell__error">{error}</div>}

        <button className="btn auth-split__submit w-100" type="submit">
          Tạo Tài Khoản
        </button>
      </form>
    </AuthLayout>
  );
}
