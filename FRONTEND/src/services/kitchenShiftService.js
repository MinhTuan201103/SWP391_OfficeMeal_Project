import apiClient from "./apiClient";

export const getMyKitchenShiftStatus = async () => {
  const { data } = await apiClient.get("/kitchen-shifts/me/status");
  return data;
};
