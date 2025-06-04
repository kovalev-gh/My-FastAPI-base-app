// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import api from "../api/axios";

interface User {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  is_superuser: boolean;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (err: any) {
        setError("Ошибка при загрузке данных пользователя.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!user) return <p>Пользователь не найден</p>;

  return (
    <div>
      <h2>Профиль</h2>
      <ul>
        <li><strong>ID:</strong> {user.id}</li>
        <li><strong>Имя пользователя:</strong> {user.username}</li>
        <li><strong>Email:</strong> {user.email || "—"}</li>
        <li><strong>Телефон:</strong> {user.phone_number || "—"}</li>
        <li><strong>Суперпользователь:</strong> {user.is_superuser ? "Да" : "Нет"}</li>
      </ul>
    </div>
  );
}
