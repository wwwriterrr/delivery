import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchGuestOrder } from "../services/cdekApi";
import type { GuestOrder } from "../services/cdekApi";
import { errorMessage, isAbortError } from "../services/http";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { OrderCard } from "../components/OrderCard";
import { ErrorState } from "../components/ErrorState";
import { PageLoader } from "../components/PageLoader";
import { ordersUrl } from "../routes/paths";
import "../App.css";
import "../components/OrdersPage.css";

const REQUIRED_PARAMS = ["InvId", "Shp_token", "Shp_preorder"] as const;

export function PaySuccessPage() {
  useDocumentTitle("Оплата прошла успешно");

  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const missing = useMemo(
    () => REQUIRED_PARAMS.filter((key) => !searchParams.get(key)),
    [searchParams]
  );

  useEffect(() => {
    if (missing.length > 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    for (const key of REQUIRED_PARAMS) params.set(key, searchParams.get(key)!);

    fetchGuestOrder(controller.signal, params)
      .then((data) => {
        const payload = data as GuestOrder & { preorder?: GuestOrder };
        setOrder(payload.preorder ?? payload);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(
          errorMessage(err, {
            notFound: "Мы не нашли этот заказ. Если деньги списаны, напишите в поддержку.",
            server: "Оплата прошла, но детали заказа сейчас недоступны. Загляните в «Мои заказы» чуть позже.",
          })
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [searchParams, missing, attempt]);

  if (missing.length > 0) {
    return (
      <div className="app">
        <h1 className="app__title">Ссылка неполная</h1>
        <ErrorState
          message={`В адресе не хватает параметров оплаты: ${missing.join(", ")}. Откройте страницу по ссылке из письма или посмотрите заказ в личном кабинете.`}
          action={
            <a className="error-state__link" href={ordersUrl()}>
              Мои заказы
            </a>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <PageLoader text="Загрузка информации о заказе..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <h1 className="app__title">Оплата прошла успешно!</h1>
        <ErrorState
          message={error}
          onRetry={retry}
          action={
            <a className="error-state__link" href={ordersUrl()}>
              Мои заказы
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="pay-success-header">
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" className="pay-success-icon" aria-hidden="true">
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
          Предзаказ оформлен. Отправка заказа осуществляется в течение 45-60 дней после оплаты. При
          отправке заказа вы получите уведомление на почту, указанную в форме. После этого статус
          заказа можно будет отслеживать в личном кабинете СДЭК.
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

export default PaySuccessPage;
