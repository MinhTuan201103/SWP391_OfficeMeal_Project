import { useEffect, useMemo, useState } from "react";
import {
  createCombo,
  createFood,
  createUser,
  deleteCombo,
  deleteFood,
  deleteUser,
  getCombos,
  getFoods,
  getKitchenShiftAdminOptions,
  getRoles,
  getUsers,
  saveTodayKitchenAssignments,
  updateCombo,
  updateFood,
  updateUser
} from "../../services/adminService";

const emptyUser = { fullName: "", email: "", password: "", phone: "", address: "", roleId: "" };
const emptyFood = { name: "", categoryId: "", price: "", discountPercent: 0, description: "", imageUrl: "" };
const emptyCombo = { name: "", price: "", discountPercent: 0, description: "", imageUrl: "", isActive: true, comboDetails: [{ foodId: "", quantity: 1 }] };
const normalizeComboDetails = (combo) => {
  const raw = combo?.items ?? combo?.Items ?? combo?.comboDetails ?? combo?.ComboDetails ?? [];
  const next = (Array.isArray(raw) ? raw : [])
    .map((x) => ({
      foodId: String(x.foodId ?? x.FoodId ?? ""),
      quantity: Number(x.quantity ?? x.Quantity ?? 1)
    }))
    .filter((x) => Number(x.foodId) > 0 && Number(x.quantity) > 0);
  return next.length ? next : [{ foodId: "", quantity: 1 }];
};

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [foods, setFoods] = useState([]);
  const [combos, setCombos] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [foodForm, setFoodForm] = useState(emptyFood);
  const [comboForm, setComboForm] = useState(emptyCombo);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateFood, setShowCreateFood] = useState(false);
  const [showCreateCombo, setShowCreateCombo] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showEditFood, setShowEditFood] = useState(false);
  const [showEditCombo, setShowEditCombo] = useState(false);
  const [editingUser, setEditingUser] = useState(emptyUser);
  const [editingFood, setEditingFood] = useState(emptyFood);
  const [editingCombo, setEditingCombo] = useState(emptyCombo);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [comboError, setComboError] = useState("");
  const [shiftUsers, setShiftUsers] = useState([]);
  const [shiftForm, setShiftForm] = useState({ shift1UserId: "", shift2UserId: "" });
  const [shiftSaving, setShiftSaving] = useState(false);
  const [shiftMessage, setShiftMessage] = useState("");
  const [shiftError, setShiftError] = useState("");
  const [showCreateUserPassword, setShowCreateUserPassword] = useState(false);

  const categoryOptions = useMemo(() => {
    const map = new Map();
    foods.forEach((f) => {
      const id = Number(f.categoryId ?? f.CategoryId);
      const name = String(f.categoryName ?? f.CategoryName ?? `Category ${id}`);
      if (id) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [foods]);

  const reload = async () => {
    const [u, r, f, c] = await Promise.all([getUsers(), getRoles(), getFoods(), getCombos()]);
    setUsers(Array.isArray(u) ? u : []);
    setRoles(Array.isArray(r) ? r : []);
    setFoods(Array.isArray(f) ? f : []);
    setCombos(Array.isArray(c) ? c : []);
  };

  useEffect(() => {
    reload().catch(() => {});
    loadShiftOptions().catch(() => {});
  }, []);

  const loadShiftOptions = async () => {
    try {
      const data = await getKitchenShiftAdminOptions();
      const usersList = Array.isArray(data?.kitchenUsers) ? data.kitchenUsers : [];
      setShiftUsers(usersList);
      setShiftForm({
        shift1UserId: data?.shift1UserId ? String(data.shift1UserId) : "",
        shift2UserId: data?.shift2UserId ? String(data.shift2UserId) : ""
      });
      setShiftError("");
    } catch (error) {
      setShiftError(error?.response?.data?.message || "Không thể tải danh sách phân ca.");
    }
  };

  const onSaveShift = async (e) => {
    e.preventDefault();
    setShiftMessage("");
    setShiftError("");
    if (shiftForm.shift1UserId && shiftForm.shift1UserId === shiftForm.shift2UserId) {
      setShiftError("Không thể chọn cùng một tài khoản cho cả 2 ca.");
      return;
    }
    setShiftSaving(true);
    try {
      const payload = {
        shift1UserId: shiftForm.shift1UserId ? Number(shiftForm.shift1UserId) : null,
        shift2UserId: shiftForm.shift2UserId ? Number(shiftForm.shift2UserId) : null
      };
      const res = await saveTodayKitchenAssignments(payload);
      setShiftMessage(res?.message || "Lưu phân ca thành công.");
      await loadShiftOptions();
    } catch (error) {
      setShiftError(error?.response?.data?.message || "Không thể lưu phân ca.");
    } finally {
      setShiftSaving(false);
    }
  };

  const onCreateUser = async (e) => {
    e.preventDefault();
    const pwd = String(userForm.password ?? "").trim();
    if (pwd.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    try {
      await createUser({
        fullName: userForm.fullName,
        email: userForm.email,
        phone: userForm.phone,
        address: userForm.address,
        roleId: Number(userForm.roleId),
        password: pwd
      });
      setUserForm(emptyUser);
      setShowCreateUserPassword(false);
      setShowCreateUser(false);
      await reload();
    } catch (error) {
      alert(error?.response?.data?.message || "Tạo user thất bại.");
    }
  };

  const onCreateFood = async (e) => {
    e.preventDefault();
    try {
      await createFood({
        name: foodForm.name,
        categoryId: Number(foodForm.categoryId),
        price: Number(foodForm.price || 0),
        discountPercent: Number(foodForm.discountPercent || 0),
        description: foodForm.description,
        imageUrl: foodForm.imageUrl || null,
        isActive: true
      });
      setFoodForm(emptyFood);
      setShowCreateFood(false);
      await reload();
    } catch (error) {
      alert(error?.response?.data?.message || "Tạo món thất bại.");
    }
  };

  const onCreateCombo = async (e) => {
    e.preventDefault();
    setComboError("");
    const comboDetails = comboForm.comboDetails
      .map((x) => ({ foodId: Number(x.foodId), quantity: Number(x.quantity) }))
      .filter((x) => x.foodId > 0 && x.quantity > 0);
    if (!comboDetails.length) {
      setComboError("Vui long chon it nhat 1 mon food cho combo.");
      return;
    }
    try {
      await createCombo({
        name: comboForm.name,
        price: Number(comboForm.price || 0),
        discountPercent: Number(comboForm.discountPercent || 0),
        description: comboForm.description,
        imageUrl: comboForm.imageUrl || null,
        isActive: true,
        comboDetails
      });
      setComboForm(emptyCombo);
      setShowCreateCombo(false);
      await reload();
    } catch (error) {
      setComboError(error?.response?.data?.message || "Tao combo that bai.");
    }
  };

  const onSaveUser = async () => {
    if (!editingUser?.id) return;
    try {
      await updateUser(editingUser.id, {
        fullName: editingUser.fullName,
        phone: editingUser.phone,
        address: editingUser.address,
        roleId: Number(editingUser.roleId),
        isActive: Boolean(editingUser.isActive)
      });
      setShowEditUser(false);
      setEditingUser(emptyUser);
      await reload();
    } catch (error) {
      alert(error?.response?.data?.message || "Cập nhật user thất bại.");
    }
  };

  const onSaveFood = async () => {
    if (!editingFood?.id) return;
    try {
      await updateFood(editingFood.id, {
        name: editingFood.name,
        price: Number(editingFood.price),
        discountPercent: Number(editingFood.discountPercent || 0),
        description: editingFood.description,
        categoryId: Number(editingFood.categoryId),
        imageUrl: editingFood.imageUrl ?? null,
        isActive: Boolean(editingFood.isActive)
      });
      setShowEditFood(false);
      setEditingFood(emptyFood);
      await reload();
    } catch (error) {
      alert(error?.response?.data?.message || "Cập nhật món thất bại.");
    }
  };

  const onSaveCombo = async () => {
    if (!editingCombo?.id) return;
    setComboError("");
    const comboDetails = (editingCombo.comboDetails ?? [])
      .map((x) => ({ foodId: Number(x.foodId), quantity: Number(x.quantity) }))
      .filter((x) => x.foodId > 0 && x.quantity > 0);
    if (!comboDetails.length) {
      setComboError("Combo phai co it nhat 1 mon food.");
      return;
    }
    try {
      await updateCombo(editingCombo.id, {
        name: editingCombo.name,
        price: Number(editingCombo.price),
        discountPercent: Number(editingCombo.discountPercent || 0),
        description: editingCombo.description,
        imageUrl: editingCombo.imageUrl ?? null,
        isActive: Boolean(editingCombo.isActive),
        comboDetails
      });
      setShowEditCombo(false);
      setEditingCombo(emptyCombo);
      await reload();
    } catch (error) {
      setComboError(error?.response?.data?.message || "Cap nhat combo that bai.");
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "user") await deleteUser(deleteConfirm.id);
      if (deleteConfirm.type === "food") await deleteFood(deleteConfirm.id);
      if (deleteConfirm.type === "combo") await deleteCombo(deleteConfirm.id);
      setDeleteConfirm(null);
      await reload();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        "Khong the xoa du lieu nay do dang co lien ket.";
      alert(message);
    }
  };

  return (
    <div className="role-panel role-admin">
      {showCreateUser && (
        <div
          className="cart-drawer-backdrop d-flex align-items-center justify-content-center"
          onClick={() => {
            setShowCreateUser(false);
            setShowCreateUserPassword(false);
          }}
        >
          <div className="card border-0 shadow p-4" style={{ width: "min(680px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Tạo User</h5>
            <form className="row g-2" onSubmit={onCreateUser}>
              <div className="col-md-6"><input className="form-control" placeholder="Họ Tên" value={userForm.fullName} onChange={(e) => setUserForm((s) => ({ ...s, fullName: e.target.value }))} required /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Email" type="email" autoComplete="off" value={userForm.email} onChange={(e) => setUserForm((s) => ({ ...s, email: e.target.value }))} required /></div>
              <div className="col-12">
                <label className="form-label small mb-1">Mật Khẩu (Tối Thiểu 6 Ký Tự)</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    placeholder="Mật Khẩu Đăng Nhập"
                    type={showCreateUserPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={userForm.password}
                    onChange={(e) => setUserForm((s) => ({ ...s, password: e.target.value }))}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCreateUserPassword((v) => !v)}
                  >
                    {showCreateUserPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>
              <div className="col-md-6"><input className="form-control" placeholder="Số Điện Thoại" value={userForm.phone} onChange={(e) => setUserForm((s) => ({ ...s, phone: e.target.value }))} /></div>
              <div className="col-md-6">
                <select className="form-select" value={userForm.roleId} onChange={(e) => setUserForm((s) => ({ ...s, roleId: e.target.value }))} required>
                  <option value="">Role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="col-12"><input className="form-control" placeholder="Địa Chỉ" value={userForm.address} onChange={(e) => setUserForm((s) => ({ ...s, address: e.target.value }))} /></div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowCreateUser(false);
                    setShowCreateUserPassword(false);
                  }}
                >
                  Hủy
                </button>
                <button className="btn btn-brand" type="submit">
                  Tạo User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUser && (
        <div className="cart-drawer-backdrop d-flex align-items-center justify-content-center" onClick={() => setShowEditUser(false)}>
          <div className="card border-0 shadow p-4" style={{ width: "min(680px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Sửa User</h5>
            <form className="row g-2" onSubmit={(e) => { e.preventDefault(); void onSaveUser(); }}>
              <div className="col-md-6"><input className="form-control" placeholder="Họ Tên" value={editingUser.fullName || ""} onChange={(e) => setEditingUser((s) => ({ ...s, fullName: e.target.value }))} required /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Email" value={editingUser.email || ""} disabled /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Số Điện Thoại" value={editingUser.phone || ""} onChange={(e) => setEditingUser((s) => ({ ...s, phone: e.target.value }))} /></div>
              <div className="col-md-6">
                <select className="form-select" value={editingUser.roleId || ""} onChange={(e) => setEditingUser((s) => ({ ...s, roleId: e.target.value }))} required>
                  <option value="">Role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="col-12"><input className="form-control" placeholder="Địa Chỉ" value={editingUser.address || ""} onChange={(e) => setEditingUser((s) => ({ ...s, address: e.target.value }))} /></div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditUser(false)}>Hủy</button>
                <button className="btn btn-brand" type="submit">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateFood && (
        <div className="cart-drawer-backdrop d-flex align-items-center justify-content-center" onClick={() => setShowCreateFood(false)}>
          <div className="card border-0 shadow p-4" style={{ width: "min(760px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Tao Mon an</h5>
            <form className="row g-2" onSubmit={onCreateFood}>
              <div className="col-md-4"><input className="form-control" placeholder="Ten mon" value={foodForm.name} onChange={(e) => setFoodForm((s) => ({ ...s, name: e.target.value }))} required /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Gia" type="number" value={foodForm.price} onChange={(e) => setFoodForm((s) => ({ ...s, price: e.target.value }))} required /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Giam (%)" type="number" min={0} max={99} value={foodForm.discountPercent} onChange={(e) => setFoodForm((s) => ({ ...s, discountPercent: e.target.value }))} /></div>
              <div className="col-md-2">
                <select className="form-select" value={foodForm.categoryId} onChange={(e) => setFoodForm((s) => ({ ...s, categoryId: e.target.value }))} required>
                  <option value="">Category</option>
                  {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-4"><input className="form-control" placeholder="Image URL" value={foodForm.imageUrl} onChange={(e) => setFoodForm((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
              <div className="col-12"><input className="form-control" placeholder="Mo ta" value={foodForm.description} onChange={(e) => setFoodForm((s) => ({ ...s, description: e.target.value }))} /></div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateFood(false)}>Huy</button>
                <button className="btn btn-brand" type="submit">Tao mon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditFood && (
        <div className="cart-drawer-backdrop d-flex align-items-center justify-content-center" onClick={() => setShowEditFood(false)}>
          <div className="card border-0 shadow p-4" style={{ width: "min(760px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Sửa Món Ăn</h5>
            <form className="row g-2" onSubmit={(e) => { e.preventDefault(); void onSaveFood(); }}>
              <div className="col-md-4"><input className="form-control" placeholder="Tên Món" value={editingFood.name || ""} onChange={(e) => setEditingFood((s) => ({ ...s, name: e.target.value }))} required /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Giá" type="number" value={editingFood.price || ""} onChange={(e) => setEditingFood((s) => ({ ...s, price: e.target.value }))} required /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Giam (%)" type="number" min={0} max={99} value={editingFood.discountPercent ?? 0} onChange={(e) => setEditingFood((s) => ({ ...s, discountPercent: e.target.value }))} /></div>
              <div className="col-md-2">
                <select className="form-select" value={editingFood.categoryId || ""} onChange={(e) => setEditingFood((s) => ({ ...s, categoryId: e.target.value }))} required>
                  <option value="">Category</option>
                  {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-4"><input className="form-control" placeholder="Image URL" value={editingFood.imageUrl || ""} onChange={(e) => setEditingFood((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows={3} placeholder="Mô Tả" value={editingFood.description || ""} onChange={(e) => setEditingFood((s) => ({ ...s, description: e.target.value }))} /></div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditFood(false)}>Hủy</button>
                <button className="btn btn-brand" type="submit">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateCombo && (
        <div className="cart-drawer-backdrop d-flex align-items-center justify-content-center" onClick={() => setShowCreateCombo(false)}>
          <div className="card border-0 shadow p-4" style={{ width: "min(720px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Tao Combo</h5>
            <form className="row g-2" onSubmit={onCreateCombo}>
              <div className="col-md-5"><input className="form-control" placeholder="Ten combo" value={comboForm.name} onChange={(e) => setComboForm((s) => ({ ...s, name: e.target.value }))} required /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Gia" type="number" value={comboForm.price} onChange={(e) => setComboForm((s) => ({ ...s, price: e.target.value }))} required /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Giam (%)" type="number" min={0} max={99} value={comboForm.discountPercent} onChange={(e) => setComboForm((s) => ({ ...s, discountPercent: e.target.value }))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Image URL" value={comboForm.imageUrl} onChange={(e) => setComboForm((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
              <div className="col-12"><input className="form-control" placeholder="Mo ta" value={comboForm.description} onChange={(e) => setComboForm((s) => ({ ...s, description: e.target.value }))} /></div>
              {comboError && <div className="col-12 text-danger small">{comboError}</div>}
              <div className="col-12">
                <div className="fw-semibold small mb-2">Mon trong combo</div>
                <div className="d-flex flex-column gap-2">
                  {(comboForm.comboDetails ?? []).map((line, idx) => (
                    <div key={`new-combo-line-${idx}`} className="row g-2 align-items-center">
                      <div className="col-md-7">
                        <select
                          className="form-select"
                          value={line.foodId}
                          onChange={(e) =>
                            setComboForm((s) => {
                              const next = [...(s.comboDetails ?? [])];
                              next[idx] = { ...next[idx], foodId: e.target.value };
                              return { ...s, comboDetails: next };
                            })
                          }
                        >
                          <option value="">Chon mon</option>
                          {foods.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}{f.isActive ? "" : " (Tam het)"}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={line.quantity}
                          onChange={(e) =>
                            setComboForm((s) => {
                              const next = [...(s.comboDetails ?? [])];
                              next[idx] = { ...next[idx], quantity: e.target.value };
                              return { ...s, comboDetails: next };
                            })
                          }
                        />
                      </div>
                      <div className="col-md-2 d-grid">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() =>
                            setComboForm((s) => {
                              const next = (s.comboDetails ?? []).filter((_, i) => i !== idx);
                              return { ...s, comboDetails: next.length ? next : [{ foodId: "", quantity: 1 }] };
                            })
                          }
                        >
                          Xoa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mt-2"
                  onClick={() =>
                    setComboForm((s) => ({
                      ...s,
                      comboDetails: [...(s.comboDetails ?? []), { foodId: "", quantity: 1 }]
                    }))
                  }
                >
                  + Them mon
                </button>
              </div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateCombo(false)}>Huy</button>
                <button className="btn btn-brand" type="submit">Tao combo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditCombo && (
        <div className="cart-drawer-backdrop d-flex align-items-center justify-content-center" onClick={() => setShowEditCombo(false)}>
          <div className="card border-0 shadow p-4" style={{ width: "min(720px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Sửa Combo</h5>
            <form className="row g-2" onSubmit={(e) => { e.preventDefault(); void onSaveCombo(); }}>
              <div className="col-md-5"><input className="form-control" placeholder="Tên Combo" value={editingCombo.name || ""} onChange={(e) => setEditingCombo((s) => ({ ...s, name: e.target.value }))} required /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Giá" type="number" value={editingCombo.price || ""} onChange={(e) => setEditingCombo((s) => ({ ...s, price: e.target.value }))} required /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Giam (%)" type="number" min={0} max={99} value={editingCombo.discountPercent ?? 0} onChange={(e) => setEditingCombo((s) => ({ ...s, discountPercent: e.target.value }))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Image URL" value={editingCombo.imageUrl || ""} onChange={(e) => setEditingCombo((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows={3} placeholder="Mô Tả" value={editingCombo.description || ""} onChange={(e) => setEditingCombo((s) => ({ ...s, description: e.target.value }))} /></div>
              {comboError && <div className="col-12 text-danger small">{comboError}</div>}
              <div className="col-12">
                <div className="fw-semibold small mb-2">Mon trong combo</div>
                <div className="d-flex flex-column gap-2">
                  {(editingCombo.comboDetails ?? []).map((line, idx) => (
                    <div key={`edit-combo-line-${idx}`} className="row g-2 align-items-center">
                      <div className="col-md-7">
                        <select
                          className="form-select"
                          value={line.foodId}
                          onChange={(e) =>
                            setEditingCombo((s) => {
                              const next = [...(s.comboDetails ?? [])];
                              next[idx] = { ...next[idx], foodId: e.target.value };
                              return { ...s, comboDetails: next };
                            })
                          }
                        >
                          <option value="">Chon mon</option>
                          {foods.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}{f.isActive ? "" : " (Tam het)"}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <input
                          type="number"
                          min={1}
                          className="form-control"
                          value={line.quantity}
                          onChange={(e) =>
                            setEditingCombo((s) => {
                              const next = [...(s.comboDetails ?? [])];
                              next[idx] = { ...next[idx], quantity: e.target.value };
                              return { ...s, comboDetails: next };
                            })
                          }
                        />
                      </div>
                      <div className="col-md-2 d-grid">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() =>
                            setEditingCombo((s) => {
                              const next = (s.comboDetails ?? []).filter((_, i) => i !== idx);
                              return { ...s, comboDetails: next.length ? next : [{ foodId: "", quantity: 1 }] };
                            })
                          }
                        >
                          Xoa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mt-2"
                  onClick={() =>
                    setEditingCombo((s) => ({
                      ...s,
                      comboDetails: [...(s.comboDetails ?? []), { foodId: "", quantity: 1 }]
                    }))
                  }
                >
                  + Them mon
                </button>
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input
                    id="editComboActive"
                    type="checkbox"
                    className="form-check-input"
                    checked={Boolean(editingCombo.isActive)}
                    onChange={(e) => setEditingCombo((s) => ({ ...s, isActive: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="editComboActive">Dang hoat dong (customer co the dat)</label>
                </div>
              </div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditCombo(false)}>Hủy</button>
                <button className="btn btn-brand" type="submit">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="cart-drawer-backdrop d-flex align-items-center justify-content-center" onClick={() => setDeleteConfirm(null)}>
          <div className="card border-0 shadow p-4" style={{ width: "min(480px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Xác Nhận Xóa</h5>
            <p className="mb-4">Bạn có chắc muốn xóa <strong>{deleteConfirm.name}</strong> không?</p>
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button type="button" className="btn btn-danger" onClick={() => void onConfirmDelete()}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow p-3 mb-4">
        <h4 className="mb-3">Admin Dashboard - Quan ly he thong</h4>
        <div className="small text-muted">Admin chi duoc CRUD user (tru Admin), mon an va combo. Khong co dat hang/gio hang.</div>
      </div>

      <div className="card border-0 shadow p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Phân Ca Kitchen Manager (Hôm Nay)</h5>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void loadShiftOptions()}>
            Tải Lại
          </button>
        </div>
        <form className="row g-3" onSubmit={onSaveShift}>
          <div className="col-md-6">
            <label className="form-label">Ca 1 (07:00 - 14:00)</label>
            <select
              className="form-select"
              value={shiftForm.shift1UserId}
              onChange={(e) => setShiftForm((s) => ({ ...s, shift1UserId: e.target.value }))}
            >
              <option value="">-- Chưa Chọn --</option>
              {shiftUsers.map((u) => (
                <option key={`shift1-${u.id}`} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Ca 2 (14:00 - 21:00)</label>
            <select
              className="form-select"
              value={shiftForm.shift2UserId}
              onChange={(e) => setShiftForm((s) => ({ ...s, shift2UserId: e.target.value }))}
            >
              <option value="">-- Chưa Chọn --</option>
              {shiftUsers.map((u) => (
                <option key={`shift2-${u.id}`} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
          {shiftError && <div className="col-12 text-danger small">{shiftError}</div>}
          {shiftMessage && <div className="col-12 text-success small">{shiftMessage}</div>}
          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-brand" type="submit" disabled={shiftSaving}>
              {shiftSaving ? "Đang Lưu..." : "Lưu Phân Ca"}
            </button>
          </div>
        </form>
      </div>

      <div className="card border-0 shadow p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">CRUD User (khong gom Admin)</h5>
          <button
            className="btn btn-brand btn-sm"
            onClick={() => {
              setShowCreateUserPassword(false);
              setShowCreateUser(true);
            }}
          >
            + Tạo User
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead><tr><th>ID</th><th>Tên</th><th>Email</th><th>Role</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.roleName}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => {
                        setEditingUser({
                          id: u.id,
                          fullName: u.fullName ?? "",
                          email: u.email ?? "",
                          phone: u.phone ?? "",
                          address: u.address ?? "",
                          roleId: String(u.roleId ?? ""),
                          isActive: Boolean(u.isActive)
                        });
                        setShowEditUser(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm({ type: "user", id: u.id, name: u.fullName })}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-0 shadow p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">CRUD Mon an</h5>
          <button className="btn btn-brand btn-sm" onClick={() => setShowCreateFood(true)}>+ Tao mon</button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead><tr><th>ID</th><th>Tên</th><th>Giá Gốc</th><th>Giảm</th><th>Giá Bán</th><th>Category</th><th>Image URL</th><th>Mô Tả</th><th /></tr></thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.name}</td>
                  <td>{Number(f.price).toLocaleString("vi-VN")} d</td>
                  <td>{Number(f.discountPercent ?? 0)}%</td>
                  <td>{Number(f.discountedPrice ?? f.price).toLocaleString("vi-VN")} d</td>
                  <td>{f.categoryName}</td>
                  <td className="small text-muted" style={{ maxWidth: 220 }}>{f.imageUrl || "-"}</td>
                  <td className="small text-muted" style={{ maxWidth: 260 }}>{f.description || "-"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => {
                        setEditingFood({
                          id: f.id,
                          name: f.name ?? "",
                          price: String(f.price ?? ""),
                          discountPercent: Number(f.discountPercent ?? 0),
                          description: f.description ?? "",
                          categoryId: String(f.categoryId ?? ""),
                          imageUrl: f.imageUrl ?? "",
                          isActive: Boolean(f.isActive)
                        });
                        setShowEditFood(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm({ type: "food", id: f.id, name: f.name })}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-0 shadow p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">CRUD Combo</h5>
          <button className="btn btn-brand btn-sm" onClick={() => setShowCreateCombo(true)}>+ Tao combo</button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead><tr><th>ID</th><th>Tên</th><th>Giá Gốc</th><th>Giảm</th><th>Giá Bán</th><th>Trạng Thái</th><th>Image URL</th><th>Mô Tả</th><th /></tr></thead>
            <tbody>
              {combos.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{Number(c.price).toLocaleString("vi-VN")} d</td>
                  <td>{Number(c.discountPercent ?? 0)}%</td>
                  <td>{Number(c.discountedPrice ?? c.price).toLocaleString("vi-VN")} d</td>
                  <td>
                    <span className={`badge ${c.isActive ? "text-bg-success" : "text-bg-secondary"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="small text-muted" style={{ maxWidth: 220 }}>{c.imageUrl || "-"}</td>
                  <td className="small text-muted" style={{ maxWidth: 260 }}>{c.description || "-"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => {
                        setEditingCombo({
                          id: c.id,
                          name: c.name ?? "",
                          price: String(c.price ?? ""),
                          discountPercent: Number(c.discountPercent ?? 0),
                          description: c.description ?? "",
                          imageUrl: c.imageUrl ?? "",
                          isActive: Boolean(c.isActive),
                          comboDetails: normalizeComboDetails(c)
                        });
                        setShowEditCombo(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm({ type: "combo", id: c.id, name: c.name })}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
