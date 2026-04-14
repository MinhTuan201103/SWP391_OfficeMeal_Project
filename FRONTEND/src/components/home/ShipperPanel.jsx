import { motion } from "framer-motion";
import { Bike, Route } from "lucide-react";

export default function ShipperPanel({ user, shipperOrders, statusLabels, moveStatus }) {
  return (
    <div className="role-panel role-shipper">
      <div className="card border-0 shadow p-3">
        <div className="d-flex align-items-center justify-content-between">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <Bike size={20} />
            Shipper Dashboard
          </h4>
          <span className="badge text-bg-info d-flex align-items-center gap-1">
            <Route size={13} />
            Delivery Route
          </span>
        </div>
        {!user && <div className="text-muted mt-2">Please login as Shipper/Admin.</div>}
        {shipperOrders.map((order) => (
          <motion.div
            key={order.orderId}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="border rounded p-3 mt-3 shipper-order-card"
          >
            <div className="d-flex justify-content-between">
              <strong>Order #{order.orderId}</strong>
              <span className="badge bg-info">{statusLabels[order.status]}</span>
            </div>
            <div className="small text-secondary">{order.deliveryAddress}</div>
            <div className="mt-2 d-flex gap-2">
              {order.status === 2 && (
                <button className="btn btn-sm btn-outline-primary" onClick={() => moveStatus(order, 3)}>
                  Nhan giao
                </button>
              )}
              {order.status === 3 && (
                <button className="btn btn-sm btn-outline-success" onClick={() => moveStatus(order, 4)}>
                  Da giao
                </button>
              )}
              {order.status === 3 && (
                <button className="btn btn-sm btn-outline-danger" onClick={() => moveStatus(order, 6)}>
                  Hoan tra
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
