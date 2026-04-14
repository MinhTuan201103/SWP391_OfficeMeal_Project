import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";

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
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Dang ky that bai.");
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center py-5">
      <div className="card auth-card border-0 shadow p-4 p-md-5">
        <p className="small text-uppercase text-secondary letter-spacing mb-1">Office Meal</p>
        <h3 className="page-section-title mb-4">Dang ky</h3>
        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            placeholder="Ho va ten"
            value={form.fullName}
            onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
          />
          <input
            className="form-control mb-3"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          />
          <input
            className="form-control mb-3"
            placeholder="So dien thoai"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
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
            Tao tai khoan
          </button>
        </form>
        <div className="small text-secondary mt-3">
          Da co tai khoan? <Link to="/login">Dang nhap</Link>
        </div>
      </div>
    </div>
  );
}
