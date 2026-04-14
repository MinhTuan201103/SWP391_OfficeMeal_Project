import { motion } from "framer-motion";
import { ChefHat, Flame } from "lucide-react";

export default function KitchenPanel({ user, kitchenOrders, foods, statusLabels, moveStatus, toggleFoodAvailability }) {
  return (
    <div className="role-panel role-kitchen">
      <div className="card border-0 shadow p-3 mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <ChefHat size={20} />
            Kitchen Dashboard
          </h4>
          <span className="badge text-bg-warning d-flex align-items-center gap-1">
            <Flame size={13} />
            Live Prep Queue
          </span>
        </div>
        {!user && <div className="text-muted mt-2">Please login as KitchenManager/Admin.</div>}
        {kitchenOrders.map((order) => (
          <motion.div
            key={order.orderId}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="border rounded p-3 mt-3 kitchen-order-card"
          >
            <div className="d-flex justify-content-between">
              <strong>Order #{order.orderId}</strong>
              <span className="badge bg-warning text-dark">{statusLabels[order.status]}</span>
            </div>
            <div className="small text-secondary">{order.customerName}</div>
            <div className="mt-2 d-flex gap-2">
              {order.status === 0 && (
                <button className="btn btn-sm btn-outline-primary" onClick={() => moveStatus(order, 1)}>
                  Bat dau nau
                </button>
              )}
              {order.status === 1 && (
                <button className="btn btn-sm btn-outline-success" onClick={() => moveStatus(order, 2)}>
                  Nau xong
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card border-0 shadow p-3">
        <h6 className="mb-3">Quan ly ton kho mon an</h6>
        {foods.map((food) => (
          <div key={food.id} className="d-flex justify-content-between border rounded p-2 mt-2">
            <span>{food.name}</span>
            <button
              className={`btn btn-sm ${food.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
              onClick={() => toggleFoodAvailability(food)}
            >
              {food.isActive ? "Tam het mon" : "Mo ban lai"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
