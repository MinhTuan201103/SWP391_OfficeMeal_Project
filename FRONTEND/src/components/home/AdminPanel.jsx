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
  getRoles,
  getUsers,
  updateCombo,
  updateFood,
  updateUser
} from "../../services/adminService";

const emptyUser = { fullName: "", email: "", phone: "", address: "", roleId: "" };
const emptyFood = { name: "", categoryId: "", price: "", description: "", imageUrl: "" };
const emptyCombo = { name: "", price: "", description: "", imageUrl: "" };

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
  }, []);

  const onCreateUser = async (e) => {
    e.preventDefault();
    await createUser({
      fullName: userForm.fullName,
      email: userForm.email,
      phone: userForm.phone,
      address: userForm.address,
      roleId: Number(userForm.roleId),
      password: "123456"
    });
    setUserForm(emptyUser);
    setShowCreateUser(false);
    await reload();
  };

  const onCreateFood = async (e) => {
    e.preventDefault();
    await createFood({
      name: foodForm.name,
      categoryId: Number(foodForm.categoryId),
      price: Number(foodForm.price || 0),
      description: foodForm.description,
      imageUrl: foodForm.imageUrl || null,
      isActive: true
    });
    setFoodForm(emptyFood);
    setShowCreateFood(false);
    await reload();
  };

  const onCreateCombo = async (e) => {
    e.preventDefault();
    await createCombo({
      name: comboForm.name,
      price: Number(comboForm.price || 0),
      description: comboForm.description,
      imageUrl: comboForm.imageUrl || null,
      isActive: true,
      comboDetails: []
    });
    setComboForm(emptyCombo);
    setShowCreateCombo(false);
    await reload();
  };

  const onSaveUser = async () => {
    if (!editingUser?.id) return;
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
  };

  const onSaveFood = async () => {
    if (!editingFood?.id) return;
    await updateFood(editingFood.id, {
      name: editingFood.name,
      price: Number(editingFood.price),
      description: editingFood.description,
      categoryId: Number(editingFood.categoryId),
      imageUrl: editingFood.imageUrl ?? null,
      isActive: Boolean(editingFood.isActive)
    });
    setShowEditFood(false);
    setEditingFood(emptyFood);
    await reload();
  };

  const onSaveCombo = async () => {
    if (!editingCombo?.id) return;
    await updateCombo(editingCombo.id, {
      name: editingCombo.name,
      price: Number(editingCombo.price),
      description: editingCombo.description,
      imageUrl: editingCombo.imageUrl ?? null,
      isActive: Boolean(editingCombo.isActive)
    });
    setShowEditCombo(false);
    setEditingCombo(emptyCombo);
    await reload();
  };

  const onConfirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "user") await deleteUser(deleteConfirm.id);
    if (deleteConfirm.type === "food") await deleteFood(deleteConfirm.id);
    if (deleteConfirm.type === "combo") await deleteCombo(deleteConfirm.id);
    setDeleteConfirm(null);
    await reload();
  };

  return (
    <div className="role-panel role-admin">
      {showCreateUser && (
        <div className="cart-drawer-backdrop d-flex align-items-center justify-content-center" onClick={() => setShowCreateUser(false)}>
          <div className="card border-0 shadow p-4" style={{ width: "min(680px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Tao User</h5>
            <form className="row g-2" onSubmit={onCreateUser}>
              <div className="col-md-6"><input className="form-control" placeholder="Ho ten" value={userForm.fullName} onChange={(e) => setUserForm((s) => ({ ...s, fullName: e.target.value }))} required /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm((s) => ({ ...s, email: e.target.value }))} required /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Phone" value={userForm.phone} onChange={(e) => setUserForm((s) => ({ ...s, phone: e.target.value }))} /></div>
              <div className="col-md-6">
                <select className="form-select" value={userForm.roleId} onChange={(e) => setUserForm((s) => ({ ...s, roleId: e.target.value }))} required>
                  <option value="">Role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="col-12"><input className="form-control" placeholder="Dia chi" value={userForm.address} onChange={(e) => setUserForm((s) => ({ ...s, address: e.target.value }))} /></div>
              <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateUser(false)}>Huy</button>
                <button className="btn btn-brand" type="submit">Tao user</button>
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
              <div className="col-md-3">
                <select className="form-select" value={foodForm.categoryId} onChange={(e) => setFoodForm((s) => ({ ...s, categoryId: e.target.value }))} required>
                  <option value="">Category</option>
                  {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-3"><input className="form-control" placeholder="Image URL" value={foodForm.imageUrl} onChange={(e) => setFoodForm((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
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
              <div className="col-md-3">
                <select className="form-select" value={editingFood.categoryId || ""} onChange={(e) => setEditingFood((s) => ({ ...s, categoryId: e.target.value }))} required>
                  <option value="">Category</option>
                  {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-3"><input className="form-control" placeholder="Image URL" value={editingFood.imageUrl || ""} onChange={(e) => setEditingFood((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
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
              <div className="col-md-4"><input className="form-control" placeholder="Image URL" value={comboForm.imageUrl} onChange={(e) => setComboForm((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
              <div className="col-12"><input className="form-control" placeholder="Mo ta" value={comboForm.description} onChange={(e) => setComboForm((s) => ({ ...s, description: e.target.value }))} /></div>
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
              <div className="col-md-4"><input className="form-control" placeholder="Image URL" value={editingCombo.imageUrl || ""} onChange={(e) => setEditingCombo((s) => ({ ...s, imageUrl: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows={3} placeholder="Mô Tả" value={editingCombo.description || ""} onChange={(e) => setEditingCombo((s) => ({ ...s, description: e.target.value }))} /></div>
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
          <h5 className="mb-0">CRUD User (khong gom Admin)</h5>
          <button className="btn btn-brand btn-sm" onClick={() => setShowCreateUser(true)}>+ Tao user</button>
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
            <thead><tr><th>ID</th><th>Tên</th><th>Giá</th><th>Category</th><th>Image URL</th><th>Mô Tả</th><th /></tr></thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.name}</td>
                  <td>{Number(f.price).toLocaleString("vi-VN")} d</td>
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
            <thead><tr><th>ID</th><th>Tên</th><th>Giá</th><th>Image URL</th><th>Mô Tả</th><th /></tr></thead>
            <tbody>
              {combos.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{Number(c.price).toLocaleString("vi-VN")} d</td>
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
                          description: c.description ?? "",
                          imageUrl: c.imageUrl ?? "",
                          isActive: Boolean(c.isActive)
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
