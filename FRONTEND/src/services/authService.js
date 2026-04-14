import apiClient from "./apiClient";
import { clearAccessToken, getAccessToken as readAccessToken, setAccessToken } from "./tokenStorage";

const AUTH_SYNC_KEY = "officeMealAuthSync";

function notifyAuthChanged(type) {
  try {
    localStorage.setItem(
      AUTH_SYNC_KEY,
      JSON.stringify({
        type,
        at: Date.now()
      })
    );
  } catch {
    /* ignore storage errors */
  }
}

export const login = async (payload) => {
  const { data } = await apiClient.post("/auth/login", payload);
  const token = data?.accessToken ?? data?.AccessToken ?? "";
  setAccessToken(token);
  notifyAuthChanged("login");
  return data;
};

export const register = async (payload) => {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
};

export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    clearAccessToken();
    notifyAuthChanged("logout");
  }
};

export const getCurrentUser = async () => {
  const { data } = await apiClient.get("/auth/me");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await apiClient.put("/auth/me", payload);
  return data;
};

export const subscribeAuthChanges = (listener) => {
  const onStorage = (event) => {
    if (event.key !== AUTH_SYNC_KEY || !event.newValue) return;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
  };
};

export const getAccessToken = () => {
  return readAccessToken();
};
