import { useEffect, useState } from "react";
import api from "../api/axios";

type User = {
  id: number;
  username: string;
  email: string | null;
  phone_number: string | null;
  is_superuser: boolean;
};

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Ошибка при получении пользователей:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p style={{ padding: "2rem" }}>Загрузка пользователей...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Пользователи</h2>
      <table border={1} cellPadding={8} cellSpacing={0}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Суперпользователь</th>
            <th>Заказы</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email ?? "—"}</td>
              <td>{u.phone_number ?? "—"}</td>
              <td>{u.is_superuser ? "✅ Да" : "—"}</td>
              <td>
                <a href={`/orders?user_id=${u.id}`}>📦 Смотреть</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
