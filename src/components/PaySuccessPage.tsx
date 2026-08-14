import { useEffect, useState } from "react";
import { CDEK_ENDPOINTS } from "../constants";
import { csrfHeaders } from "../services/csrf";
import type { GuestOrder } from "../services/cdekApi";
import { OrderCard } from "./OrderCard";
import "./OrdersPage.css";

interface Props {
  invoiceId: string;
  shpToken: string;
  shpPreorder: string;
}

export function PaySuccessPage({ invoiceId, shpToken, shpPreorder }: Props) {
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams();
    params.set("InvId", invoiceId);
    params.set("Shp_token", shpToken);
    params.set("Shp_preorder", shpPreorder);

    const url = `${CDEK_ENDPOINTS.submitGuestOrder}?${params.toString()}`;

    fetch(url, { signal: controller.signal, headers: csrfHeaders() })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            if (data?.error) throw new Error(data.error);
            throw new Error(`Запрос не удался: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data.preorder ?? data);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Не удалось загрузить заказ");
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [invoiceId, shpToken, shpPreorder]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading-overlay" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
          <div className="loading-overlay__text">Загрузка информации о заказе...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <h1 className="app__title">Ошибка</h1>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="pay-success-header">
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" className="pay-success-icon">
          <circle cx="26" cy="26" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
          <path
            d="M15 27 L23 35 L37 19"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1 className="app__title">Оплата прошла успешно!</h1>
        <p className="pay-success-text">
          Предзаказ оформлен. Отправка заказа осуществляется в течение 45-60 дней после оплаты. При отправке заказа вы получите уведомление на почту, указ анную в форме. После этого статус заказа можно будет отслеживать в личном кабинете СДЭК.
        </p>
      </div>

      {order && (
        <div className="orders-list orders-list--center">
          <OrderCard order={order} showCoins={false} />
        </div>
      )}
    </div>
  );
}
