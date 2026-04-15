import apiClient from "./apiClient";

export const getUsers = async () => {
  const { data } = await apiClient.get("/users");
  return data;
};

export const getRoles = async () => {
  const { data } = await apiClient.get("/users/roles");
  return data;
};

export const createUser = async (payload) => {
  const { data } = await apiClient.post("/users", payload);
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await apiClient.put(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id) => {
  await apiClient.delete(`/users/${id}`);
};

export const getFoods = async () => {
  const { data } = await apiClient.get("/foods");
  return data;
};

export const createFood = async (payload) => {
  const { data } = await apiClient.post("/foods", payload);
  return data;
};

export const updateFood = async (id, payload) => {
  const { data } = await apiClient.put(`/foods/${id}`, payload);
  return data;
};

export const deleteFood = async (id) => {
  await apiClient.delete(`/foods/${id}`);
};

export const getCombos = async () => {
  const { data } = await apiClient.get("/combos");
  return data;
};

export const createCombo = async (payload) => {
  const { data } = await apiClient.post("/combos", payload);
  return data;
};

export const updateCombo = async (id, payload) => {
  const { data } = await apiClient.put(`/combos/${id}`, payload);
  return data;
};

export const deleteCombo = async (id) => {
  await apiClient.delete(`/combos/${id}`);
};

export const getKitchenShiftAdminOptions = async () => {
  const { data } = await apiClient.get("/kitchen-shifts/admin/options");
  return data;
};

export const saveTodayKitchenAssignments = async (payload) => {
  const { data } = await apiClient.put("/kitchen-shifts/admin/today-assignments", payload);
  return data;
};
