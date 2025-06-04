import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await registerUser(form);
      navigate("/login");
    } catch (err: any) {
      console.error("Ошибка при регистрации:", err);
      setError("Не удалось зарегистрироваться");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Имя пользователя" value={form.username} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Пароль" value={form.password} onChange={handleChange} required />
        <input name="phone_number" placeholder="Телефон" value={form.phone_number} onChange={handleChange} required />
        <button type="submit">Зарегистрироваться</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Register;
