import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { getCustomerOrders } from "../services/orderService";
import { getCurrentUser, subscribeAuthChanges } from "../services/authService";
import { createOrderHubConnection } from "../services/orderHub";
import {
  ORDER_STATUS_VI,
  ORDER_TABS,
  formatPaymentVi,
  getOrderStatus
} from "../constants/orders";

export default function MyOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") || "all";
  const tabId = ORDER_TABS.some((t) => t.id === rawTab) ? rawTab : "all";

  const setTab = (id) => {
    setSearchParams(id === "all" ? {} : { tab: id });
  };

  const refreshUser = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const list = await getCustomerOrders();
      if (Array.isArray(list)) setOrders(list);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        await refreshUser();
      }
    }
  }, [refreshUser]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    const r = user.role?.toLowerCase?.() ?? "";
    if (r !== "customer") return;
    void loadOrders();
  }, [user, loadOrders]);

  useEffect(() => {
    if (!user) return undefined;
    const r = user.role?.toLowerCase?.() ?? "";
    if (r !== "customer") return undefined;

    const connection = createOrderHubConnection((orderId, status) => {
      setOrders((prev) =>
        prev.map((o) => {
          const id = o.orderId ?? o.OrderId;
          if (Number(id) === Number(orderId)) {
            return { ...o, status };
          }
          return o;
        })
      );
      void loadOrders();
    });
    connection.start().catch(() => {});
    return () => {
      connection.stop().catch(() => {});
    };
  }, [user, loadOrders]);

  useEffect(() => {
    const unsubscribe = subscribeAuthChanges(() => {
      void refreshUser();
    });
    return unsubscribe;
  }, [refreshUser]);

  useEffect(() => {
    const onFocus = () => {
      void refreshUser();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshUser]);

  const filtered = useMemo(() => {
    const tab = ORDER_TABS.find((t) => t.id === tabId) ?? ORDER_TABS[0];
    return orders.filter((o) => tab.match(getOrderStatus(o)));
  }, [orders, tabId]);

  if (loading) {
    return (
      <div className="page-orders page-orders--loading">
        <div className="container py-5 text-center text-muted">Đang Tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const r = user.role?.toLowerCase?.() ?? "";
  if (r !== "customer") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-orders">
      <header className="orders-hero">
        <div className="container">
          <div className="d-flex align-items-center gap-3 py-4">
            <Link to="/" className="orders-back-btn btn btn-light rounded-circle p-2 shadow-sm">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="h4 mb-0 fw-bold text-white">Đơn Hàng Của Tôi</h1>
              <p className="mb-0 small text-white-50">Theo dõi trạng thái giống ứng dụng đặt món</p>
            </div>
            <Package className="ms-auto text-white opacity-50 d-none d-md-block" size={40} />
          </div>
        </div>
      </header>

      <div className="container pb-5">
        <div className="orders-tabs-wrap">
          <div className="orders-tabs">
            {ORDER_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`orders-tab ${tabId === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="orders-empty card border-0 shadow-sm text-center py-5 mt-4">
            <Package className="text-muted mb-3" size={48} />
            <p className="text-muted mb-0">Chưa có đơn hàng trong mục này.</p>
            <Link to="/" className="btn btn-brand mt-3">
              Đặt Món Ngay
            </Link>
          </div>
        ) : (
          <div className="row g-4 mt-1">
            {filtered.map((order) => {
              const oid = order.orderId ?? order.OrderId;
              const items = order.items ?? order.Items ?? [];
              const total = order.totalAmount ?? order.TotalAmount;
              const pm = order.paymentMethod ?? order.PaymentMethod;
              const st = getOrderStatus(order);
              const dateRaw = order.orderDate ?? order.OrderDate;
              const addr = order.deliveryAddress ?? order.DeliveryAddress;
              return (
                <div key={oid} className="col-12">
                  <article className="order-sheet card border-0 shadow-sm">
                    <div className="order-sheet__head d-flex flex-wrap justify-content-between align-items-start gap-2 p-3 p-md-4 border-bottom border-light">
                      <div>
                        <span className="text-muted small">Đơn Hàng</span>
                        <div className="fw-bold fs-5">#{oid}</div>
                        <div className="small text-muted">
                          {dateRaw ? new Date(dateRaw).toLocaleString("vi-VN") : ""}
                        </div>
                      </div>
                      <span className={`order-status-pill status-${st}`}>{ORDER_STATUS_VI[st] ?? st}</span>
                    </div>
                    <div className="p-3 p-md-4">
                      <div className="row g-2 small text-muted mb-3">
                        <div className="col-sm-6">
                          <span className="text-uppercase fw-semibold letter-spacing">Thanh Toán</span>
                          <div className="text-dark">{formatPaymentVi(pm)}</div>
                        </div>
                        {addr && (
                          <div className="col-sm-6">
                            <span className="text-uppercase fw-semibold letter-spacing">Giao Đến</span>
                            <div className="text-dark">{addr}</div>
                          </div>
                        )}
                      </div>
                      <div className="order-lines">
                        {items.map((line, idx) => {
                          const name = line.itemName ?? line.ItemName;
                          const qty = line.quantity ?? line.Quantity;
                          const unit = line.unitPrice ?? line.UnitPrice;
                          const sub = Number(qty) * Number(unit);
                          return (
                            <div key={idx} className="order-line d-flex justify-content-between py-2 border-bottom border-light">
                              <span>
                                {name}
                                <span className="text-muted"> x{qty}</span>
                              </span>
                              <span className="fw-medium">{sub.toLocaleString("vi-VN")} d</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="d-flex justify-content-between align-items-center pt-3 mt-2">
                        <span className="text-muted">Tổng Cộng</span>
                        <span className="fs-4 fw-bold brand-text">{Number(total).toLocaleString("vi-VN")} d</span>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
