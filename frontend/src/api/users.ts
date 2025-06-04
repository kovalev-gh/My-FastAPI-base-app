import api from "./axios";

export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

export async function createUser(user: {
  username: string;
  password: string;
  phone_number?: string;
}) {
  const response = await api.post("/users", user);
  return response.data;
}
