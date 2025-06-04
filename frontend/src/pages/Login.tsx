import { useState } from "react";
import { login } from "../api/auth";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(username, password);
      setToken(data.access_token);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Неверное имя пользователя или пароль");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Войти</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {token && (
        <div>
          <p style={{ color: "green" }}>Успешный вход! Токен:</p>
          <code>{token}</code>
        </div>
      )}
    </div>
  );
}

export default Login;
