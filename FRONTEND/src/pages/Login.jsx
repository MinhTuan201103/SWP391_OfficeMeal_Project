import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const email = form.email.trim();
    const password = form.password.trim();
    if (!email || !password) {
      setError("Vui long nhap day du email va mat khau.");
      return;
    }
    try {
      await login({ email, password });
      sessionStorage.setItem("officeMealFlashNotice", "Đăng nhập thành công.");
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng nhập thất bại.");
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center py-5">
      <div className="card auth-card border-0 shadow p-4 p-md-5">
        <p className="small text-uppercase text-secondary letter-spacing mb-1">Office Meal</p>
        <h3 className="page-section-title mb-4">Dang nhap</h3>
        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            required
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            required
            minLength={6}
          />
          {error && <div className="text-danger small mb-3">{error}</div>}
          <button className="btn btn-brand w-100 py-2 rounded-pill" type="submit">
            Dang nhap
          </button>
        </form>
        <div className="small text-secondary mt-3">
          Chua co tai khoan? <Link to="/register">Dang ky</Link>
        </div>
      </div>
    </div>
  );
}
