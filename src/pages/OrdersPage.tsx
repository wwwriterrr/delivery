import { useCallback, useEffect, useState } from "react";
import { fetchOrders } from "../services/cdekApi";
import type { Order } from "../services/cdekApi";
import { errorMessage, classifyError, isAbortError } from "../services/http";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { OrderCard } from "../components/OrderCard";
import { ErrorState } from "../components/ErrorState";
import { PageLoader } from "../components/PageLoader";
import { BACKEND_URL } from "../constants";
import "../App.css";
import "../components/OrdersPage.css";

export function OrdersPage() {
  useDocumentTitle("Мои заказы");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchOrders(controller.signal)
      .then((data) => {
        setOrders(data);
        setNeedsLogin(false);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        // A 403 here means "not signed in", not "something broke".
        setNeedsLogin(classifyError(err) === "auth");
        setError(
          errorMessage(err, {
            auth: "Заказы доступны только авторизованным пользователям. Войдите в аккаунт, чтобы их увидеть.",
            server: "Не удалось загрузить список заказов. Попробуйте через несколько минут.",
          })
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  if (loading) {
    return (
      <div className="app">
        <PageLoader text="Загрузка заказов..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <h1 className="app__title">Мои заказы</h1>
        <ErrorState
          title={needsLogin ? "Нужен вход в аккаунт" : "Не удалось загрузить заказы"}
          message={error}
          onRetry={retry}
          action={
            needsLogin ? (
              // TODO: point at the real Django login URL once it is known.
              <a className="error-state__link" href={BACKEND_URL}>
                На сайт
              </a>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="app__title">Мои заказы</h1>

      {orders.length === 0 ? (
        <p className="orders-empty">
          Заказов пока нет. Как только вы оформите предзаказ, он появится здесь.
        </p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} showCoins />
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
