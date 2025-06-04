import { useEffect, useState } from "react";
import { createOrderFromCart } from "../api/orders";
import {
  getCart,
  removeFromCart,
  updateCart,
  clearCart,
} from "../api/cart";

type CartItem = {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    title: string;
    retail_price: number | null;
  };
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setCartItems(data);
    } catch (error) {
      console.error("Ошибка загрузки корзины", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (product_id: number) => {
    await removeFromCart(product_id);
    fetchCart();
  };

  const handleUpdate = async (product_id: number, quantity: number) => {
    if (quantity < 1) return;
    await updateCart(product_id, quantity);
    fetchCart();
  };

  const handleClear = async () => {
    await clearCart();
    fetchCart();
  };

  const handleOrder = async () => {
    try {
      await createOrderFromCart();
      alert("✅ Заказ оформлен!");
      fetchCart(); // обновим корзину
    } catch (err) {
      alert("❌ Не удалось оформить заказ");
      console.error(err);
    }
  };

  const total = cartItems.reduce((acc, item) => {
    const price = item.product.retail_price ?? 0;
    return acc + price * item.quantity;
  }, 0);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Корзина</h2>
      {cartItems.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <>
          <ul>
            {cartItems.map((item) => (
              <li key={item.id} style={{ marginBottom: "1rem" }}>
                <strong>{item.product.title}</strong> —{" "}
                {item.product.retail_price ?? "нет цены"} ₽ × {item.quantity} шт.
                <br />
                <button onClick={() => handleRemove(item.product_id)}>Удалить</button>
                <button onClick={() => handleUpdate(item.product_id, item.quantity + 1)}>+1</button>
                <button
                  onClick={() => handleUpdate(item.product_id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -1
                </button>
              </li>
            ))}
          </ul>

          <p>
            <strong>Итого:</strong> {total} ₽
          </p>

          <button onClick={handleOrder} style={{ marginRight: "1rem" }}>
            Оформить заказ
          </button>

          <button onClick={handleClear}>Очистить корзину</button>
        </>
      )}
    </div>
  );
}
