import { useState } from "react";
import { login } from "../api/auth";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.access_token);

      // ⏩ Форсированная перезагрузка и переход на профиль
      window.location.href = "/profile";
    } catch (err: any) {
      console.error("Login error:", err);
      setError("❌ Неверное имя пользователя или пароль");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", paddingTop: "2rem" }}>
      <h2>Вход</h2>

      {!submitting && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label>Имя пользователя</label><br />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>Пароль</label><br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <button type="submit">Войти</button>
        </form>
      )}

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}

export default Login;
