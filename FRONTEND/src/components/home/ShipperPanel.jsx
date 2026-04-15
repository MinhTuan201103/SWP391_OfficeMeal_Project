import { motion } from "framer-motion";
import { Bike, Route } from "lucide-react";

function getOrderStatus(order) {
  const s = order?.status ?? order?.Status;
  const n = typeof s === "number" ? s : parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

export default function ShipperPanel({ user, shipperOrders, statusLabels, moveStatus }) {
  return (
    <div className="role-panel role-shipper">
      <div className="card border-0 shadow p-3">
        <div className="d-flex align-items-center justify-content-between">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <Bike size={20} />
            Bảng Giao Hàng
          </h4>
          <span className="badge text-bg-info d-flex align-items-center gap-1">
            <Route size={13} />
            Tuyến Giao
          </span>
        </div>
        {!user && (
          <div className="text-muted mt-2">Vui lòng đăng nhập bằng tài khoản Nhân Viên Giao Hàng hoặc Quản Trị Viên.</div>
        )}
        {shipperOrders.map((order) => {
          const st = getOrderStatus(order);
          const oid = order.orderId ?? order.OrderId;
          const addr = order.deliveryAddress ?? order.DeliveryAddress ?? "";
          return (
            <motion.div
              key={oid}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="border rounded p-3 mt-3 shipper-order-card"
            >
              <div className="d-flex justify-content-between">
                <strong>Đơn #{oid}</strong>
                <span className="badge bg-info">{statusLabels[st] ?? "—"}</span>
              </div>
              <div className="small text-secondary">{addr}</div>
              <div className="mt-2 d-flex gap-2 flex-wrap">
                {st === 2 && (
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => moveStatus(order, 3)}>
                    Nhận Giao
                  </button>
                )}
                {st === 3 && (
                  <button type="button" className="btn btn-sm btn-outline-success" onClick={() => moveStatus(order, 4)}>
                    Đã Giao
                  </button>
                )}
                {st === 3 && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => moveStatus(order, 6)}>
                    Hoàn Trả
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
