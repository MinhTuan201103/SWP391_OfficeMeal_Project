import apiClient from "./apiClient";

export const getOrders = async () => {
  const { data } = await apiClient.get("/orders");
  return data;
};

export const getCustomerOrders = async () => {
  const { data } = await apiClient.get("/orders/customer");
  return data;
};

export const getKitchenOrders = async () => {
  const { data } = await apiClient.get("/orders/kitchen");
  return data;
};

export const getShipperOrders = async () => {
  const { data } = await apiClient.get("/orders/shipper");
  return data;
};

export const createOrder = async (payload) => {
  const { data } = await apiClient.post("/orders", payload);
  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const { data } = await apiClient.patch(`/orders/${orderId}/status`, { status });
  return data;
};

export const confirmOrderPayment = async (orderId, provider, transactionCode) => {
  const { data } = await apiClient.patch(`/orders/${orderId}/payment-confirm`, {
    provider,
    transactionCode
  });
  return data;
};
