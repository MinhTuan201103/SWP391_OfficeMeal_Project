import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Flame, ListOrdered, UtensilsCrossed } from "lucide-react";
import {
  aggregateKitchenPrep,
  formatOrderDateTime,
  getOrderLineTexts
} from "../../utils/kitchenOrderUtils";

function getOrderId(order) {
  return order.orderId ?? order.OrderId;
}

function getCustomerName(order) {
  return order.customerName ?? order.CustomerName ?? "";
}

function getOrderStatus(order) {
  const s = order?.status ?? order?.Status;
  const n = typeof s === "number" ? s : parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

export default function KitchenPanel({ user, kitchenOrders, foods, statusLabels, moveStatus, batchSetFoodAvailability }) {
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [searchUn, setSearchUn] = useState("");
  const [pickUnavailableId, setPickUnavailableId] = useState("");
  const [pendingUnavailable, setPendingUnavailable] = useState([]);
  const [savingMark, setSavingMark] = useState(false);

  /** Các món đang tạm hết (tick để mở bán lại). */
  const [reopenSelection, setReopenSelection] = useState([]);
  const [reopening, setReopening] = useState(false);

  const totals = useMemo(() => aggregateKitchenPrep(kitchenOrders), [kitchenOrders]);

  const foodsById = useMemo(() => {
    const m = new Map();
    for (const f of foods) {
      m.set(f.id, f);
    }
    return m;
  }, [foods]);

  const inactiveFoods = useMemo(
    () => foods.filter((f) => !f.isActive).sort((a, b) => String(a.name).localeCompare(String(b.name), "vi")),
    [foods]
  );

  /** Bỏ tick các món không còn trong danh sách tạm hết (sau khi lưu / đồng bộ). */
  useEffect(() => {
    const ids = new Set(inactiveFoods.map((f) => f.id));
    setReopenSelection((prev) => prev.filter((id) => ids.has(id)));
  }, [inactiveFoods]);

  const filteredActive = useMemo(() => {
    const q = searchUn.trim().toLowerCase();
    return foods.filter((f) => f.isActive && (!q || String(f.name).toLowerCase().includes(q)));
  }, [foods, searchUn]);

  const addUnavailable = () => {
    const id = Number(pickUnavailableId);
    if (!id) return;
    setPendingUnavailable((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPickUnavailableId("");
  };

  const removeFromPendingUnavailable = (id) => {
    setPendingUnavailable((prev) => prev.filter((x) => x !== id));
  };

  const closeModal = () => {
    setMarkModalOpen(false);
    setSearchUn("");
    setPickUnavailableId("");
    setPendingUnavailable([]);
  };

  const handleSaveMark = async () => {
    if (pendingUnavailable.length === 0) {
      closeModal();
      return;
    }
    setSavingMark(true);
    try {
      const updates = pendingUnavailable.map((id) => ({ id, isActive: false }));
      await batchSetFoodAvailability(updates);
      closeModal();
    } catch {
      alert("Không thể lưu trạng thái món. Vui lòng thử lại.");
    } finally {
      setSavingMark(false);
    }
  };

  const openMarkModal = () => {
    setPendingUnavailable([]);
    setSearchUn("");
    setPickUnavailableId("");
    setMarkModalOpen(true);
  };

  const toggleReopen = (id) => {
    setReopenSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllInactive = () => {
    setReopenSelection(inactiveFoods.map((f) => f.id));
  };

  const deselectAllInactive = () => {
    setReopenSelection([]);
  };

  const handleReopenSelected = async () => {
    if (reopenSelection.length === 0) return;
    setReopening(true);
    try {
      const updates = reopenSelection.map((id) => ({ id, isActive: true }));
      await batchSetFoodAvailability(updates);
      setReopenSelection([]);
    } catch {
      alert("Không thể mở bán lại. Vui lòng thử lại.");
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="role-panel role-kitchen">
      <div className="card border-0 shadow p-3 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <ChefHat size={20} />
            Bảng Điều Khiển Bếp
          </h4>
          <span className="badge text-bg-warning d-flex align-items-center gap-1">
            <Flame size={13} />
            Hàng Đợi Chế Biến Trực Tiếp
          </span>
        </div>
        {!user && (
          <div className="text-muted mt-2">Vui lòng đăng nhập bằng tài khoản Quản Lý Bếp hoặc Quản Trị Viên.</div>
        )}

        {totals.length > 0 && (
          <div className="kitchen-prep-total card border-0 bg-light mt-3 p-3 rounded-3">
            <div className="d-flex align-items-center gap-2 mb-2 fw-semibold text-dark">
              <ListOrdered size={18} />
              Tổng Hợp Món Cần Chuẩn Bị (Tất Cả Đơn)
            </div>
            <div className="d-flex flex-wrap gap-2">
              {totals.map(([name, qty]) => (
                <span key={name} className="badge rounded-pill text-bg-dark px-3 py-2 fw-normal">
                  {qty} x {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {kitchenOrders.map((order) => {
          const oid = getOrderId(order);
          const st = getOrderStatus(order);
          const items = order.items ?? order.Items ?? [];
          const lines = items.flatMap((it) => getOrderLineTexts(it));
          const when = formatOrderDateTime(order);
          const who = getCustomerName(order);
          return (
            <motion.div
              key={oid}
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.2 }}
              className="border rounded p-3 mt-3 kitchen-order-card"
            >
              <div className="d-flex justify-content-between flex-wrap gap-2">
                <strong>Đơn #{oid}</strong>
                <span className="badge bg-warning text-dark">{statusLabels[st] ?? "—"}</span>
              </div>
              {when && <div className="small text-muted mt-1">Đặt lúc: {when}</div>}
              <div className="mt-2">
                <span className="fw-semibold">Người đặt:</span> {who || "—"}
              </div>
              {lines.length > 0 && (
                <div className="mt-2 small">
                  <div className="fw-semibold mb-1">Món đặt:</div>
                  <ul className="mb-0 ps-3">
                    {lines.map((line, idx) => (
                      <li key={`${oid}-line-${idx}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 d-flex gap-2 flex-wrap">
                {st === 0 && (
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => moveStatus(order, 1)}>
                    Bắt Đầu Nấu
                  </button>
                )}
                {st === 1 && (
                  <button type="button" className="btn btn-sm btn-outline-success" onClick={() => moveStatus(order, 2)}>
                    Nấu Xong
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card border-0 shadow p-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <h6 className="mb-0 d-flex align-items-center gap-2">
            <UtensilsCrossed size={18} />
            Quản Lý Món Ăn
          </h6>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={openMarkModal}>
            Đánh Dấu Tạm Hết Món
          </button>
        </div>
        <p className="small text-muted mb-3">
          Trong cửa sổ chỉ chọn món cần đánh dấu tạm hết. Danh sách món đang tạm hết hiển thị bên dưới.
        </p>

        <div className="border rounded-3 p-3 bg-light">
          <div className="fw-semibold mb-2">Món Đang Tạm Hết</div>
          {inactiveFoods.length === 0 ? (
            <p className="small text-muted mb-0">Hiện không có món nào đang tạm hết.</p>
          ) : (
            <>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={selectAllInactive}>
                  Chọn Tất Cả
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={deselectAllInactive}>
                  Bỏ Chọn Tất Cả
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleReopenSelected}
                  disabled={reopening || reopenSelection.length === 0}
                >
                  {reopening ? "Đang Xử Lý..." : "Mở Bán Lại"}
                </button>
              </div>
              <div className="d-flex flex-column gap-2">
                {inactiveFoods.map((f) => (
                  <label
                    key={f.id}
                    className="d-flex align-items-center gap-2 small mb-0 py-1 px-2 rounded bg-white border cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={reopenSelection.includes(f.id)}
                      onChange={() => toggleReopen(f.id)}
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {markModalOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Đánh Dấu Tạm Hết Món</h5>
                  <button type="button" className="btn-close" aria-label="Đóng" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <label className="form-label fw-semibold">Chọn Món Cần Đánh Dấu Tạm Hết</label>
                  <input
                    type="search"
                    className="form-control form-control-sm mb-2"
                    placeholder="Tìm theo tên món..."
                    value={searchUn}
                    onChange={(e) => setSearchUn(e.target.value)}
                  />
                  <div className="row g-2 align-items-end">
                    <div className="col-md-8">
                      <select
                        className="form-select"
                        value={pickUnavailableId}
                        onChange={(e) => setPickUnavailableId(e.target.value)}
                        size={Math.min(8, Math.max(3, filteredActive.length + 1))}
                      >
                        <option value="">— Chọn món đang mở bán —</option>
                        {filteredActive.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100"
                        onClick={addUnavailable}
                        disabled={!pickUnavailableId}
                      >
                        Cộng Thêm
                      </button>
                    </div>
                  </div>
                  {pendingUnavailable.length > 0 && (
                    <div className="mt-3">
                      <div className="small text-muted mb-1">Sẽ đánh dấu tạm hết sau khi lưu:</div>
                      <div className="d-flex flex-wrap gap-1">
                        {pendingUnavailable.map((id) => (
                          <span key={`u-${id}`} className="badge text-bg-light border d-inline-flex align-items-center gap-1">
                            {foodsById.get(id)?.name ?? id}
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-danger"
                              onClick={() => removeFromPendingUnavailable(id)}
                              aria-label="Xóa"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeModal} disabled={savingMark}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-brand"
                    onClick={handleSaveMark}
                    disabled={savingMark || pendingUnavailable.length === 0}
                  >
                    {savingMark ? "Đang Lưu..." : "Lưu"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
