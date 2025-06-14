import axios from "axios";

const API_URL = "/api/v1/auth";

export async function login(username: string, password: string) {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  params.append("grant_type", "password");

  const response = await axios.post(`${API_URL}/token`, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data; // { access_token, token_type }
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  phone_number: string;
}) {
  const response = await axios.post("/api/v1/auth/register", data);
  return response.data;
}
