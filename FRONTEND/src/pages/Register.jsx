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
      title="Đăng Ký"
      subtitle="Tạo Tài Khoản Mới Để Đặt Cơm Trưa Văn Phòng, Ưu Đãi Và Tích Điểm Sau Này."
      footer={
        <p className="auth-shell__switch mb-0">
          Đã Có Tài Khoản?{" "}
          <Link to="/login" className="auth-shell__switch-link">
            Đăng Nhập
          </Link>
        </p>
      }
    >
      <form className="auth-shell__form" onSubmit={handleSubmit} noValidate>
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
          <div className="auth-field__control">
            <Lock className="auth-field__icon" size={18} strokeWidth={2} aria-hidden />
            <input
              id="reg-password"
              type="password"
              className="form-control auth-field__input"
              autoComplete="new-password"
              placeholder="Tối Thiểu 6 Ký Tự"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
        </div>

        {error && <div className="auth-shell__error">{error}</div>}

        <button className="btn btn-brand auth-shell__submit w-100" type="submit">
          Tạo Tài Khoản
        </button>
      </form>
    </AuthLayout>
  );
}
