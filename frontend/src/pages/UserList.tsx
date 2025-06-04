import { useEffect, useState } from "react";
import { getUsers } from "../api/users";
import { Link } from "react-router-dom";

type User = {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  is_superuser: boolean;
};

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => console.error("Ошибка загрузки пользователей", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка пользователей...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Пользователи</h2>
      {users.length === 0 ? (
        <p>Нет пользователей</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Почта</th>
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
                <td>{u.is_superuser ? "Да" : "Нет"}</td>
                <td>
                  <Link to={`/orders/user/${u.id}`}>Посмотреть</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
