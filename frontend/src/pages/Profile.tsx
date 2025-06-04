import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface User {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  is_superuser: boolean;
  // Добавь другие поля по желанию
}

function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (err: any) {
        console.error("Ошибка при получении пользователя:", err);
        setError("Не удалось получить информацию о пользователе");
        navigate("/login"); // перенаправление если токен недействителен
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!user) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Профиль</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Имя пользователя:</strong> {user.username}</p>
      <p><strong>Email пользователя:</strong> {user.email}</p>
      <p><strong>Телефон пользователя:</strong> {user.phone_number}</p>
      <p><strong>Суперпользователь:</strong> {user.is_superuser ? "Да" : "Нет"}</p>

      <button onClick={handleLogout}>Выйти</button>
    </div>
  );
}

export default Profile;
