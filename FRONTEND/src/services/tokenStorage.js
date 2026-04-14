const AUTH_TOKEN_KEY = "officeMealAccessToken";

export const getAccessToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY) || "";

export const setAccessToken = (token) => {
  if (!token) return;
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
};
