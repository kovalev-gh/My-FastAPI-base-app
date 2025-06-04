// src/api/users.ts
import api from "./axios";

// Получить всех пользователей
export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

// Создать нового пользователя
export async function createUser(user: {
  username: string;
  password: string;
  phone_number?: string;
}) {
  const response = await api.post("/users", user);
  return response.data;
}

// Получить одного пользователя по ID
export async function getUserById(id: number) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}
