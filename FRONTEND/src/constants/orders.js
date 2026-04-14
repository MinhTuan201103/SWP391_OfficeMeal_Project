/** Trang thai don (OrderStatus enum backend) */
export const ORDER_STATUS_VI = [
  "Chờ Xác Nhận",
  "Đang Chuẩn Bị",
  "Sẵn Sàng Giao",
  "Đang Giao",
  "Đã Giao",
  "Đã Hủy",
  "Hoàn Trả"
];

export const ORDER_TABS = [
  { id: "all", label: "Tất Cả", match: () => true },
  {
    id: "processing",
    label: "Đang Xử Lý",
    match: (s) => s <= 2
  },
  {
    id: "shipping",
    label: "Đang Giao",
    match: (s) => s === 3
  },
  {
    id: "done",
    label: "Đã Giao",
    match: (s) => s === 4
  },
  {
    id: "issue",
    label: "Đã Hủy / Trả Hàng",
    match: (s) => s === 5 || s === 6
  }
];

export function getOrderStatus(order) {
  const s = order?.status ?? order?.Status;
  return typeof s === "number" ? s : parseInt(s, 10);
}

export function formatPaymentVi(method) {
  const m = String(method ?? "").toLowerCase();
  if (m === "cash") return "Tiền Mặt";
  if (m === "momo") return "MoMo";
  if (m === "zalopay") return "ZaloPay";
  if (m === "vnpay") return "VNPay";
  return method || "-";
}
