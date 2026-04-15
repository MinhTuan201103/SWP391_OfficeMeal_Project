/** Chuẩn hóa dòng món từ API (camelCase / PascalCase). */
export function normalizeOrderItem(raw) {
  return {
    foodId: raw.foodId ?? raw.FoodId,
    comboId: raw.comboId ?? raw.ComboId,
    quantity: Number(raw.quantity ?? raw.Quantity ?? 0),
    itemName: String(raw.itemName ?? raw.ItemName ?? "").trim(),
    comboComponents: (raw.comboComponents ?? raw.ComboComponents ?? []).map((c) => ({
      foodId: c.foodId ?? c.FoodId,
      foodName: String(c.foodName ?? c.FoodName ?? "").trim(),
      quantity: Number(c.quantity ?? c.Quantity ?? 1)
    }))
  };
}

export function formatOrderDateTime(order) {
  const v = order?.orderDate ?? order?.OrderDate;
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Các dòng hiển thị cho một dòng đơn (gói combo được bung thành món thành phần). */
export function getOrderLineTexts(item) {
  const normalized = normalizeOrderItem(item);
  if (normalized.comboId && normalized.comboComponents.length > 0) {
    return normalized.comboComponents.map((comp) => {
      const qty = normalized.quantity * Math.max(1, comp.quantity);
      return `${qty} x ${comp.foodName}`;
    });
  }
  if (normalized.itemName) {
    return [`${normalized.quantity} x ${normalized.itemName}`];
  }
  return [];
}

/**
 * Gộp tất cả món trong các đơn đang xử lý bếp (Pending + Preparing).
 * Combo được cộng theo từng món thành phần.
 */
export function aggregateKitchenPrep(kitchenOrders) {
  const map = new Map();
  for (const order of kitchenOrders) {
    const items = order.items ?? order.Items ?? [];
    for (const raw of items) {
      const normalized = normalizeOrderItem(raw);
      if (normalized.comboId && normalized.comboComponents.length > 0) {
        for (const comp of normalized.comboComponents) {
          const name = comp.foodName;
          if (!name) continue;
          const qty = normalized.quantity * Math.max(1, comp.quantity);
          map.set(name, (map.get(name) || 0) + qty);
        }
      } else if (normalized.itemName) {
        map.set(normalized.itemName, (map.get(normalized.itemName) || 0) + normalized.quantity);
      }
    }
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "vi"));
}
