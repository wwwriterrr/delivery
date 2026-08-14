import { useEffect, useState } from "react";
import { fetchOrders } from "../services/cdekApi";
import type { Order } from "../services/cdekApi";
import { OrderCard } from "./OrderCard";
import "./OrdersPage.css";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchOrders(controller.signal)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Не удалось загрузить заказы");
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="loading-overlay" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
          <div className="loading-overlay__text">Загрузка заказов...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <h1 className="app__title">Заказы</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="app__title">Заказы</h1>

      {orders.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
          Заказов пока нет
        </p>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} showCoins />
        ))}
      </div>
    </div>
  );
}
