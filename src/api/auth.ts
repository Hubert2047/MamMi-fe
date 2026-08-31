import api from "./axios";

export async function loginAPI(
  data: { account: string; password: string; storeId?: string },
  config = {},
) {
  return api.post("/auth/login", JSON.stringify(data), config);
}
export async function getLoginStores(data: {
  account: string;
  password: string;
}) {
  return api.post("/auth/login-stores", data);
}
export function logoutAPI(config = {}) {
  return api.delete("/auth/logout", config);
}
