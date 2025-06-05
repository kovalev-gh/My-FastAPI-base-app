import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface User {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  is_superuser: boolean;
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
        console.error("Ошибка при получении пользователя:", err?.response ?? err?.message ?? err);
        setError("Не удалось получить информацию о пользователе");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: "auto", color: "red" }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return <p>Загрузка...</p>;
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Профиль</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Имя пользователя:</strong> {user.username}</p>
      {user.email && <p><strong>Email:</strong> {user.email}</p>}
      {user.phone_number && <p><strong>Телефон:</strong> {user.phone_number}</p>}
      {user.is_superuser && (
        <p style={{ color: "green", fontWeight: "bold" }}>Суперпользователь: Да</p>
      )}

      <button onClick={handleLogout}>Выйти</button>
    </div>
  );
}

export default Profile;
