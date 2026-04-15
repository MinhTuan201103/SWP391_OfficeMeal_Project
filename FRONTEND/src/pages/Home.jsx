import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getOrders,
  getCustomerOrders,
  getKitchenOrders,
  getShipperOrders,
  createOrder,
  updateOrderStatus
} from "../services/orderService";
import { getCurrentUser, logout, subscribeAuthChanges } from "../services/authService";
import { createOrderHubConnection } from "../services/orderHub";
import apiClient from "../services/apiClient";
import CustomerPanel from "../components/home/CustomerPanel";
import KitchenPanel from "../components/home/KitchenPanel";
import ShipperPanel from "../components/home/ShipperPanel";
import AdminPanel from "../components/home/AdminPanel";
import { Package, ShoppingCart, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ORDER_STATUS_VI } from "../constants/orders";

const FOODS_API_URL = "/foods";
const CART_KEY = "officeMealCart";
const normalizeList = (value) => (Array.isArray(value) ? value : []);
const getUserRole = (user) => String(user?.role ?? user?.Role ?? "").toLowerCase();
const resolveItemType = (item) => {
  const explicitType = String(item?.itemType ?? "").toLowerCase();
  if (explicitType === "combo" || explicitType === "food") {
    return explicitType;
  }
  const cartKey = String(item?.cartKey ?? "").toLowerCase();
  if (cartKey.startsWith("combo-")) return "combo";
  if (cartKey.startsWith("food-")) return "food";
  const categoryName = String(item?.categoryName ?? item?.CategoryName ?? "").toLowerCase();
  if (categoryName.includes("combo")) return "combo";
  return "food";
};
const getMainGroupByCategory = (categoryName) => {
  const c = String(categoryName ?? "").toLowerCase();
  if (c.includes("nuoc") || c.includes("drink") || c.includes("tea") || c.includes("coffee")) return "drink";
  if (c.includes("combo")) return "combo";
  return "food";
};
const isAuthzError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};
const ROLE_META = {
  customer: { key: "customer", heroClass: "hero-customer", label: "Khách Hàng" },
  kitchenmanager: { key: "kitchen", heroClass: "hero-kitchen", label: "Quản Lý Bếp" },
  shipper: { key: "shipper", heroClass: "hero-shipper", label: "Nhân Viên Giao Hàng" },
  admin: { key: "admin", heroClass: "hero-admin", label: "Quản Trị Viên" }
};

export default function Home() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [combos, setCombos] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [addressMode, setAddressMode] = useState("profile"); // profile | other
  const [addressError, setAddressError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [foodSort, setFoodSort] = useState("popular");
  const [activeCategory, setActiveCategory] = useState("all");
  const [mainGroup, setMainGroup] = useState("food");

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * Number(item.discountedPrice ?? item.price), 0),
    [cart]
  );
  const menuItems = useMemo(() => {
    const foodItems = normalizeList(foods).map((food) => ({
      ...food,
      id: food.id ?? food.Id,
      name: food.name ?? food.Name,
      price: Number(food.price ?? food.Price ?? 0),
      discountPercent: Number(food.discountPercent ?? food.DiscountPercent ?? 0),
      discountedPrice: Number(
        food.discountedPrice ??
          food.DiscountedPrice ??
          (Number(food.price ?? food.Price ?? 0) * (100 - Number(food.discountPercent ?? food.DiscountPercent ?? 0))) / 100
      ),
      description: food.description ?? food.Description ?? "",
      imageUrl: food.imageUrl ?? food.ImageUrl ?? "",
      categoryName: food.categoryName ?? food.CategoryName ?? "",
      isActive: Boolean(food.isActive ?? food.IsActive ?? true),
      itemType: "food",
      cartKey: `food-${food.id ?? food.Id}`
    }));
    const comboItems = normalizeList(combos).map((combo) => ({
      ...combo,
      id: combo.id ?? combo.Id,
      name: combo.name ?? combo.Name,
      price: Number(combo.price ?? combo.Price ?? 0),
      discountPercent: Number(combo.discountPercent ?? combo.DiscountPercent ?? 0),
      discountedPrice: Number(
        combo.discountedPrice ??
          combo.DiscountedPrice ??
          (Number(combo.price ?? combo.Price ?? 0) * (100 - Number(combo.discountPercent ?? combo.DiscountPercent ?? 0))) / 100
      ),
      description: combo.description ?? combo.Description ?? "",
      imageUrl: combo.imageUrl ?? combo.ImageUrl ?? "",
      items: normalizeList(combo.items ?? combo.Items).map((item) => ({
        foodId: item.foodId ?? item.FoodId,
        foodName: item.foodName ?? item.FoodName ?? "",
        quantity: Number(item.quantity ?? item.Quantity ?? 1)
      })),
      categoryName: "combo",
      itemType: "combo",
      isActive: Boolean(combo.isActive ?? combo.IsActive ?? true),
      cartKey: `combo-${combo.id ?? combo.Id}`
    }));
    return [...foodItems, ...comboItems].filter((x) => Number.isFinite(Number(x.id)));
  }, [foods, combos]);

  const filteredFoods = useMemo(() => {
    const keyword = foodQuery.trim().toLowerCase();
    let nextFoods = menuItems.filter((item) => {
      const categoryName = String(item.categoryName ?? item.CategoryName ?? "").toLowerCase();
      if (mainGroup === "combo") {
        if (item.itemType !== "combo") return false;
      } else {
        if (item.itemType !== "food") return false;
        if (mainGroup === "food" || mainGroup === "drink") {
          const group = getMainGroupByCategory(categoryName);
          if (group !== mainGroup) return false;
        }
      }
      if (activeCategory !== "all") {
        if (categoryName !== activeCategory) return false;
      }
      if (!keyword) return true;
      const name = String(item.name ?? "").toLowerCase();
      const description = String(item.description ?? "").toLowerCase();
      return name.includes(keyword) || description.includes(keyword);
    });

    if (foodSort === "priceAsc") {
      nextFoods = [...nextFoods].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (foodSort === "priceDesc") {
      nextFoods = [...nextFoods].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (foodSort === "nameAsc") {
      nextFoods = [...nextFoods].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    return nextFoods;
  }, [menuItems, foodQuery, foodSort, activeCategory, mainGroup]);

  const categories = useMemo(() => {
    if (mainGroup === "combo") return ["all"];
    const names = new Set(
      menuItems
        .filter((item) => item.itemType === "food")
        .map((food) => String(food.categoryName ?? food.CategoryName ?? "").trim())
        .filter(Boolean)
    );
    return ["all", ...Array.from(names).map((x) => x.toLowerCase())];
  }, [mainGroup, menuItems]);

  const groupedCategoryCounts = useMemo(() => {
    const result = { all: menuItems.length, food: 0, drink: 0, combo: 0 };
    menuItems.forEach((food) => {
      if (food.itemType === "combo") {
        result.combo += 1;
        return;
      }
      const categoryName = String(food.categoryName ?? food.CategoryName ?? "").toLowerCase();
      const group = getMainGroupByCategory(categoryName);
      result[group] += 1;
    });
    return result;
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!cartNotice) return undefined;
    const timer = setTimeout(() => setCartNotice(""), 2200);
    return () => clearTimeout(timer);
  }, [cartNotice]);

  useEffect(() => {
    const flash = sessionStorage.getItem("officeMealFlashNotice");
    if (!flash) return;
    setCartNotice(flash);
    sessionStorage.removeItem("officeMealFlashNotice");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const profileAddress = String(user?.address ?? user?.Address ?? "").trim();

  useEffect(() => {
    // when user changes, prefer profile address if available
    if (!user) return;
    if (profileAddress) {
      setAddressMode("profile");
      setAddressError("");
    } else {
      setAddressMode("other");
    }
  }, [user, profileAddress]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [foodsRes, combosRes] = await Promise.all([
          apiClient.get(FOODS_API_URL),
          apiClient.get("/combos")
        ]);
        setFoods(normalizeList(foodsRes.data));
        setCombos(normalizeList(combosRes.data));
        await refreshUser();
      } catch (error) {
        console.error("Cannot load home data:", error);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [refreshUser]);

  const reloadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    const r = getUserRole(user);
    try {
      let list;
      if (r === "customer") {
        list = await getCustomerOrders();
      } else if (r === "kitchenmanager") {
        list = await getKitchenOrders();
      } else if (r === "shipper") {
        list = await getShipperOrders();
      } else if (r === "admin") {
        setOrders([]);
        return;
      } else {
        list = await getOrders();
      }
      if (!Array.isArray(list)) {
        console.warn("reloadOrders: response is not an array, keeping current list", list);
        return;
      }
      setOrders(list);
    } catch (e) {
      console.warn("reloadOrders failed, keeping current orders", e);
    }
  }, [user]);

  useEffect(() => {
    void reloadOrders();
  }, [reloadOrders]);

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

  useEffect(() => {
    if (!user) {
      return undefined;
    }
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
      void reloadOrders();
    });
    connection
      .start()
      .catch((err) => console.warn("SignalR orderHub:", err));
    return () => {
      connection.stop().catch(() => {});
    };
  }, [user, reloadOrders]);

  const addToCart = (food) => {
    if (!canUseCart) {
      alert("Bạn cần đăng nhập bằng tài khoản Customer để thêm món vào giỏ hàng.");
      return;
    }
    if (!food?.id) return;
    setCart((current) => {
      const key = food.cartKey ?? `${food.itemType}-${food.id}`;
      const existing = current.find((item) => item.cartKey === key);
      if (existing) {
        return current.map((item) =>
          item.cartKey === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...food, cartKey: key, quantity: 1 }];
    });
    setCartNotice(`Đã thêm ${food.name} vào giỏ hàng.`);
  };

  const updateCartQuantity = (cartKey, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCart((current) => current.filter((item) => item.cartKey !== cartKey));
      return;
    }
    setCart((current) =>
      current.map((item) => (item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item))
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((current) => current.filter((item) => item.cartKey !== cartKey));
  };

  const placeOrder = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập tài khoản Customer trước.");
      return;
    }

    setAddressError("");

    const selectedAddress =
      addressMode === "profile" ? profileAddress : String(address ?? "").trim();

    if (!cart.length) {
      return;
    }

    if (!selectedAddress) {
      setAddressError("Vui long chon dia chi trong profile hoac nhap dia chi giao hang.");
      return;
    }

    const payload = {
      deliveryAddress: selectedAddress,
      paymentMethod,
      items: cart
        .map((item) => {
          const itemType = resolveItemType(item);
          const itemId = Number(item.id);
          const quantity = Number(item.quantity);
          if (!Number.isFinite(itemId) || itemId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
            return null;
          }
          return {
            foodId: itemType === "food" ? itemId : null,
            comboId: itemType === "combo" ? itemId : null,
            quantity
          };
        })
        .filter(Boolean)
    };

    if (!payload.items.length) {
      alert("Giỏ hàng hiện có dữ liệu không hợp lệ. Vui lòng xóa và thêm lại món/combo rồi đặt lại.");
      return;
    }

    try {
      const created = await createOrder(payload);
      const refreshed = await getCustomerOrders().catch(() => null);
      if (Array.isArray(refreshed)) {
        setOrders(refreshed);
      }
      const isOnlinePayment = ["momo", "zalopay", "vnpay"].includes(String(paymentMethod).toLowerCase());
      const orderId = created?.orderId ?? created?.OrderId;
      const totalAmount = created?.totalAmount ?? created?.TotalAmount ?? cartTotal;
      setCart([]);
      setAddress("");
      setAddressMode(profileAddress ? "profile" : "other");
      setAddressError("");
      setIsCartOpen(false);
      if (isOnlinePayment && orderId) {
        navigate(
          `/payment/checkout?orderId=${encodeURIComponent(orderId)}&provider=${encodeURIComponent(
            paymentMethod
          )}&amount=${encodeURIComponent(totalAmount)}`
        );
      } else {
        navigate("/orders");
      }
    } catch (error) {
      console.error("Create order failed:", error);
      alert("Đặt hàng thất bại. Bạn hãy đăng nhập bằng tài khoản Customer trước.");
    }
  };

  const moveStatus = async (order, nextStatus) => {
    try {
      const oid = order.orderId ?? order.OrderId;
      const updated = await updateOrderStatus(oid, nextStatus);
      const uid = updated.orderId ?? updated.OrderId;
      setOrders((current) =>
        current.map((item) => {
          const iid = item.orderId ?? item.OrderId;
          return iid === uid ? updated : item;
        })
      );
    } catch (error) {
      console.error("Update status failed:", error);
      if (isAuthzError(error)) {
        await refreshUser();
      }
      alert("Không đủ quyền hoặc sai luồng trạng thái.");
    }
  };

  const batchSetFoodAvailability = async (updates) => {
    if (!updates.length) return;
    await Promise.all(
      updates.map(({ id, isActive }) =>
        apiClient.patch(`/foods/${id}/availability`, isActive, {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    setFoods((current) => {
      const map = new Map(updates.map((u) => [u.id, u.isActive]));
      return current.map((item) => (map.has(item.id) ? { ...item, isActive: map.get(item.id) } : item));
    });
  };

  const safeOrders = normalizeList(orders);
  const kitchenOrders = safeOrders.filter((x) => x.status <= 1);
  const shipperOrders = safeOrders.filter((x) => x.status === 2 || x.status === 3);
  const role = getUserRole(user);
  const roleMeta = ROLE_META[role] ?? ROLE_META.customer;
  const viewMode = roleMeta.key;
  const canUseCart = viewMode === "customer" && role === "customer";

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsCartOpen(false);
  };

  return (
    <div className="home-page py-4 py-md-5">
      <div className="container">
        <div className={`hero ${roleMeta.heroClass} p-4 p-md-5 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3`}>
          <div>
            <div className="hero-label mb-2">Cơm Văn Phòng Chuẩn Vị</div>
            <h1 className="mb-2">OfficeMeal Smart Delivery</h1>
            <p className="mb-0 hero-subtitle">Đặt món tại văn phòng với theo dõi thời gian thực.</p>
          </div>
          {!user ? (
            <div className="auth-box p-3 d-flex gap-2">
              <Link className="btn btn-sm btn-light" to="/login">
                Đăng Nhập
              </Link>
              <Link className="btn btn-sm btn-outline-light" to="/register">
                Đăng Ký
              </Link>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end hero-actions">
              {canUseCart && (
                <>
                  <Link
                    className="btn btn-sm btn-light cart-icon-btn"
                    to="/profile"
                    aria-label="Hồ Sơ Cá Nhân"
                    title="Hồ Sơ Cá Nhân"
                  >
                    <UserRound size={16} />
                  </Link>
                  <Link
                    className="btn btn-sm btn-light cart-icon-btn"
                    to="/orders"
                    aria-label="Đơn hàng"
                    title="Đơn hàng"
                  >
                    <Package size={16} />
                  </Link>
                  <button
                    className="btn btn-sm btn-light cart-icon-btn"
                    onClick={() => setIsCartOpen(true)}
                    aria-label="Mở Giỏ Hàng"
                  >
                    <ShoppingCart size={16} />
                    {cart.length > 0 && <span className="cart-icon-count">{cart.length}</span>}
                  </button>
                </>
              )}
              <span className="badge bg-light text-dark">{user.fullName}</span>
              <span className="badge role-badge">{roleMeta.label}</span>
              <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>
                Đăng Xuất
              </button>
            </div>
          )}
        </div>

        {cartNotice && (
          <div className="cart-toast-notice">
            {cartNotice}
          </div>
        )}

        {loading ? (
          <div className="row g-3">
            {[...Array(4)].map((_, idx) => (
              <div className="col-sm-6 col-lg-4 col-xl-3" key={idx}>
                <div className="loading-skeleton" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {viewMode === "customer" && (
              <CustomerPanel
                foods={menuItems}
                filteredFoods={filteredFoods}
                canUseCart={canUseCart}
                addToCart={addToCart}
                cart={cart}
                cartTotal={cartTotal}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                profileAddress={profileAddress}
                addressMode={addressMode}
                setAddressMode={(mode) => {
                  setAddressMode(mode);
                  setAddressError("");
                  if (mode === "other") setAddress("");
                }}
                address={address}
                setAddress={(next) => {
                  setAddress(next);
                  setAddressError("");
                }}
                addressError={addressError}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                placeOrder={placeOrder}
                isCartOpen={isCartOpen}
                setIsCartOpen={setIsCartOpen}
                foodQuery={foodQuery}
                setFoodQuery={setFoodQuery}
                foodSort={foodSort}
                setFoodSort={setFoodSort}
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                mainGroup={mainGroup}
                setMainGroup={setMainGroup}
                groupedCategoryCounts={groupedCategoryCounts}
              />
            )}

            {viewMode === "kitchen" && (
              <KitchenPanel
                user={user}
                kitchenOrders={kitchenOrders}
                foods={foods}
                statusLabels={ORDER_STATUS_VI}
                moveStatus={moveStatus}
                batchSetFoodAvailability={batchSetFoodAvailability}
              />
            )}

            {viewMode === "shipper" && (
              <ShipperPanel
                user={user}
                shipperOrders={shipperOrders}
                statusLabels={ORDER_STATUS_VI}
                moveStatus={moveStatus}
              />
            )}

            {viewMode === "admin" && <AdminPanel />}
          </>
        )}
      </div>
    </div>
  );
}
