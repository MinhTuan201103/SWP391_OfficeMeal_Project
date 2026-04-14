import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Wallet } from "lucide-react";
import { confirmOrderPayment } from "../services/orderService";
import { getCurrentUser } from "../services/authService";

export default function PaymentCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    getCurrentUser()
      .then((me) => setUser(me))
      .catch(() => setUser(null));
  }, []);

  const orderId = Number(searchParams.get("orderId") || 0);
  const providerRaw = String(searchParams.get("provider") || "momo").toLowerCase();
  const provider = providerRaw === "zalopay" ? "ZaloPay" : providerRaw === "vnpay" ? "VNPay" : "MoMo";
  const amount = Number(searchParams.get("amount") || 0);

  if (user === null) return <Navigate to="/login" replace />;
  if (!orderId || amount <= 0) return <Navigate to="/" replace />;

  const handleConfirmPaid = async () => {
    setError("");
    setProcessing(true);
    try {
      await confirmOrderPayment(orderId, provider, `${providerRaw}-${Date.now()}`);
      setDone(true);
      setTimeout(() => navigate("/orders"), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Xac nhan thanh toan that bai.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="auth-page py-5">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="card border-0 shadow-sm p-4 p-md-5">
          <p className="small text-uppercase text-secondary letter-spacing mb-1">Office Meal</p>
          <h3 className="page-section-title d-flex align-items-center gap-2">
            <Wallet size={20} />
            Thanh toan {provider}
          </h3>
          <p className="text-muted mb-3">
            Don hang <strong>#{orderId}</strong> - So tien <strong>{amount.toLocaleString("vi-VN")} d</strong>
          </p>

          <div className="alert alert-light border">
            Day la luong thanh toan sandbox de test app (mock cong {provider}). Bam nut ben duoi de xac nhan da thanh toan.
          </div>

          {error && <div className="text-danger small mb-3">{error}</div>}
          {done && (
            <div className="text-success d-flex align-items-center gap-2 mb-3">
              <CheckCircle2 size={18} />
              Thanh toan thanh cong. Dang chuyen den Don hang cua toi...
            </div>
          )}

          <div className="d-flex gap-2 justify-content-end mt-3">
            <Link to="/" className="btn btn-brand-outline rounded-pill px-4">
              Ve trang chu
            </Link>
            <button className="btn btn-brand rounded-pill px-4" onClick={handleConfirmPaid} disabled={processing || done}>
              {processing ? "Dang xu ly..." : "Toi da thanh toan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
