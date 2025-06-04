import api from "./axios";

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}
