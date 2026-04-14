import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import { getCurrentUser, updateProfile } from "../services/authService";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);
        setForm({
          fullName: me?.fullName ?? me?.FullName ?? "",
          phone: me?.phone ?? me?.Phone ?? "",
          address: me?.address ?? me?.Address ?? ""
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const role = user?.role?.toLowerCase?.() ?? user?.Role?.toLowerCase?.() ?? "";

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim()
    };
    if (!payload.fullName) {
      setError("Ho ten khong duoc de trong.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(payload);
      setUser(updated);
      setForm({
        fullName: updated?.fullName ?? updated?.FullName ?? "",
        phone: updated?.phone ?? updated?.Phone ?? "",
        address: updated?.address ?? updated?.Address ?? ""
      });
      setMessage("Cap nhat profile thanh cong.");
    } catch (err) {
      setError(err?.response?.data?.message || "Cap nhat profile that bai.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page d-flex align-items-center justify-content-center py-5">
        <div className="text-muted">Dang tai profile...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "customer") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page py-4 py-md-5">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Link to="/" className="btn btn-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
            <ArrowLeft size={18} />
          </Link>
          <h2 className="page-section-title mb-0 d-flex align-items-center gap-2">
            <UserRound size={20} />
            Profile ca nhan
          </h2>
        </div>

        <div className="card border-0 shadow-sm p-4 p-md-5">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Ho va ten</label>
                <input
                  className="form-control"
                  value={form.fullName}
                  onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">So dien thoai</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  maxLength={20}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Email</label>
                <input className="form-control bg-light" value={user?.email ?? user?.Email ?? ""} disabled />
              </div>
              <div className="col-12">
                <label className="form-label">Dia chi mac dinh</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                  maxLength={250}
                />
              </div>
            </div>
            {error && <div className="text-danger small mt-3">{error}</div>}
            {message && <div className="text-success small mt-3">{message}</div>}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Link to="/" className="btn btn-brand-outline rounded-pill px-4">
                Quay lai
              </Link>
              <button className="btn btn-brand rounded-pill px-4" disabled={saving} type="submit">
                {saving ? "Dang luu..." : "Luu thay doi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
