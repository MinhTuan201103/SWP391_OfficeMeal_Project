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
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Dang nhap that bai.");
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
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
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
