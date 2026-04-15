import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CupSoda, Layers, MapPin, Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";

export default function CustomerPanel({
  foods,
  filteredFoods,
  canUseCart,
  addToCart,
  cart,
  cartTotal,
  updateCartQuantity,
  removeFromCart,
  profileAddress,
  addressMode,
  setAddressMode,
  address,
  setAddress,
  addressError,
  paymentMethod,
  setPaymentMethod,
  placeOrder,
  isCartOpen,
  setIsCartOpen,
  foodQuery,
  setFoodQuery,
  foodSort,
  setFoodSort,
  categories,
  activeCategory,
  setActiveCategory,
  mainGroup,
  setMainGroup
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const heroImages = useMemo(() => {
    const urls = foods.map((x) => x.imageUrl).filter(Boolean);
    return urls.length ? urls : ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600"];
  }, [foods]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <div className="row g-3 role-panel role-customer customer-layout">
      <div className="col-xl-2 col-lg-3">
        <aside className="customer-sidebar card border-0 shadow-sm p-0 overflow-hidden">
          <div className="p-3 text-center border-bottom">
            <img src="/brand-logo.png" alt="OfficeMeal" className="customer-brand-image mx-auto mb-2" />
            <div className="small text-muted">Trạm Ẩm Thực</div>
          </div>
          <div className="d-grid gap-1 p-2 border-bottom">
            <button
              type="button"
              className={`btn text-start rounded-3 customer-side-action ${mainGroup !== "combo" ? "active" : ""}`}
              onClick={() => setMainGroup("food")}
            >
              <CupSoda size={16} className="me-2" />
              Food & Drink
            </button>
            <button
              type="button"
              className={`btn text-start rounded-3 customer-side-action ${mainGroup === "combo" ? "active" : ""}`}
              onClick={() => setMainGroup("combo")}
            >
              <Layers size={16} className="me-2" />
              Gói Combo
            </button>
          </div>
          <div className="p-2 small text-muted border-top">OfficeMeal Smart Delivery</div>
        </aside>
      </div>

      <div className="col-xl-10 col-lg-9">
        <div className="customer-top-nav card border-0 mb-3">
          <div className="d-flex align-items-center gap-4 px-3 py-2">
            <a href="#" className="active">TRANG CHU</a>
            <a href="#">MENU</a>
            <a href="#">LIÊN HỆ</a>
          </div>
        </div>
        <div className="customer-hero-banner mb-3" style={{ backgroundImage: `url(${heroImages[slideIndex]})` }}>
          <div className="customer-hero-overlay">
            <h3>Cơm Văn Phòng Mỗi Ngày</h3>
            <p>Menu thay đổi theo ngày, đặt món nhanh cho văn phòng</p>
          </div>
        </div>
        <div className="customer-menu-shell p-3 p-md-4">
          <div className="menu-toolbar card border-0 shadow-sm p-2 p-md-3 mb-3">
            <div className="d-flex align-items-center gap-2 customer-search-pill">
              <button className="btn btn-warning rounded-circle p-0 d-inline-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }} type="button">
                <Search size={16} />
              </button>
              <input
                className="form-control border-0 shadow-none bg-transparent"
                placeholder="Tìm Kiếm"
                value={foodQuery}
                onChange={(event) => setFoodQuery(event.target.value)}
              />
            </div>
            <select className="form-select form-select-sm rounded-3 border-0 bg-light" value={foodSort} onChange={(event) => setFoodSort(event.target.value)}>
              <option value="popular">Gợi Ý</option>
              <option value="priceAsc">Giá: Thấp Đến Cao</option>
              <option value="priceDesc">Giá: Cao Đến Thấp</option>
              <option value="nameAsc">Tên: A-Z</option>
            </select>
          </div>

          <div className="category-chips mb-3">
            {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`btn btn-sm rounded-pill ${activeCategory === category ? "btn-dark" : "btn-outline-secondary"}`}
              onClick={() => setActiveCategory(category)}
            >
                {category === "all" ? "Tất Cả" : category}
            </button>
            ))}
          </div>
          <div className="row g-3">
            {filteredFoods.map((food) => (
              <div className="col-sm-6 col-lg-6 col-xl-4" key={food.id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`card menu-card h-100 border-0 ${!food.isActive ? "menu-card-disabled" : ""}`}
                >
                  <img src={food.imageUrl || "https://via.placeholder.com/600x320?text=OfficeMeal"} className="card-img-top" alt={food.name} />
                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-semibold mb-1">{food.name}</h6>
                    {!food.isActive && (
                      <div className="small text-danger fw-semibold mb-1">Tạm hết món</div>
                    )}
                    {food.description && (
                      <div className="small text-muted mb-1">{food.description}</div>
                    )}
                    <div className="text-warning fw-bold small">
                      Giá: {Number(food.discountedPrice ?? food.price).toLocaleString("vi-VN")} VND
                    </div>
                    {Number(food.discountPercent ?? 0) > 0 && (
                      <div className="small text-danger fw-semibold">-{Number(food.discountPercent)}%</div>
                    )}
                    {food.itemType === "combo" && Array.isArray(food.items) && food.items.length > 0 && (
                      <div className="small text-muted mb-1">
                        {food.items.map((item, idx) => (
                          <div key={`${food.id}-combo-item-${idx}`}>
                            {item.quantity} x {item.foodName}
                          </div>
                        ))}
                      </div>
                    )}
                    {Number(food.discountPercent ?? 0) > 0 && (
                      <div className="small text-muted text-decoration-line-through mb-2">
                        {Number(food.price).toLocaleString("vi-VN")} VND
                      </div>
                    )}
                    <div className="mt-auto d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-warning rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
                        style={{ width: 34, height: 34 }}
                        onClick={() => addToCart(food)}
                        disabled={!food.isActive}
                      >
                        <ShoppingBag size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
            {foods.length > 0 && filteredFoods.length === 0 && (
              <div className="col-12">
                <div className="text-center text-muted py-5">Không tìm thấy món phù hợp.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCartOpen && <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)} />}
      <aside className={`cart-drawer ${isCartOpen ? "open" : ""}`}>
        <div className="card border-0 shadow-lg h-100 rounded-4 overflow-hidden">
          <div className="cart-drawer-inner p-3 p-md-4 h-100 d-flex flex-column bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="d-flex align-items-center gap-2 mb-0 fw-bold">
                <ShoppingBag size={20} className="brand-text" />
                Giỏ Hàng
              </h5>
              <button type="button" className="btn btn-sm btn-light rounded-pill" onClick={() => setIsCartOpen(false)}>
                Đóng
              </button>
            </div>
            <div className="small text-muted mb-2">{cart.length} Món</div>
            <div className="cart-items-wrap flex-grow-1">
              {cart.map((item) => (
                <div key={item.cartKey ?? item.id} className="cart-item-row py-3">
                  <div className="d-flex justify-content-between gap-2">
                    <span className="small fw-medium">{item.name}</span>
                    <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFromCart(item.cartKey ?? item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="qty-control">
                      <button type="button" className="btn btn-sm btn-light border rounded-circle p-1" onClick={() => updateCartQuantity(item.cartKey ?? item.id, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" className="btn btn-sm btn-light border rounded-circle p-1" onClick={() => updateCartQuantity(item.cartKey ?? item.id, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <strong>{(item.quantity * Number(item.discountedPrice ?? item.price)).toLocaleString("vi-VN")} d</strong>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <div className="small text-muted py-4 text-center">Giỏ Hàng Trống.</div>}
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-baseline mb-3">
              <span className="text-muted">Tạm Tính</span>
              <span className="fs-5 fw-bold brand-text">{cartTotal.toLocaleString("vi-VN")} d</span>
            </div>
            <label className="form-label mb-1 small text-muted d-flex align-items-center gap-1">
              <MapPin size={13} />
              Địa Chỉ Giao Hàng
            </label>
            <select
              className="form-select rounded-3 mb-2"
              value={addressMode}
              onChange={(event) => setAddressMode(event.target.value)}
            >
              <option value="profile">Địa Chỉ Trong Hồ Sơ</option>
              <option value="other">Địa Chỉ Khác</option>
            </select>

            {addressMode === "profile" ? (
              <div className="form-control rounded-3 mb-2 bg-light">
                {profileAddress?.trim() ? profileAddress : "Chưa có địa chỉ trong hồ sơ. Vui lòng chọn 'Địa Chỉ Khác' hoặc cập nhật hồ sơ."}
              </div>
            ) : (
              <input
                className="form-control rounded-3 mb-2"
                placeholder="Nhập Địa Chỉ Giao Hàng Khác"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            )}

            {addressError ? <div className="text-danger small mb-2">{addressError}</div> : <div className="small text-muted mb-2">Bắt Buộc Để Đặt Hàng</div>}
            <select className="form-select rounded-3 mb-3" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="Cash">Tiền Mặt Khi Nhận</option>
              <option value="MoMo">MoMo</option>
              <option value="ZaloPay">ZaloPay</option>
              <option value="VNPay">VNPay</option>
            </select>
            <button type="button" className="btn btn-brand btn-lg rounded-pill w-100 mt-auto" onClick={placeOrder} disabled={cart.length === 0}>
              Đặt Hàng
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
