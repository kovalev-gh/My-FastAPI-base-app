import axios from "axios";

const API_URL = "/api/v1/carts";
const token = localStorage.getItem("token");

const authHeader = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

export async function getCart() {
  const res = await axios.get(API_URL, authHeader);
  return res.data;
}

export async function addToCart(product_id: number, quantity: number) {
  return axios.post(`${API_URL}/add`, { product_id, quantity }, authHeader);
}

export async function updateCart(product_id: number, quantity: number) {
  return axios.patch(`${API_URL}/update`, { product_id, quantity }, authHeader);
}

export async function removeFromCart(product_id: number) {
  return axios.delete(`${API_URL}/remove/${product_id}`, authHeader);
}

export async function clearCart() {
  return axios.delete(`${API_URL}/clear`, authHeader);
}
