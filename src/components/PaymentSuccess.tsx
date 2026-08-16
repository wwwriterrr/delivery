import { useEffect, useRef } from "react";
import { ordersUrl } from "../routes/paths";
import { scrollIntoView } from "../utils/scroll";
import "./PaymentSuccess.css";

/**
 * Shown after both payment flows — coins for signed-in readers, the card
 * redirect for guests — so the wording and the moment stay identical.
 *
 * It scrolls itself into view: the signed-in flow swaps the page content in
 * place while the reader is parked at the bottom of a long form, and the
 * confirmation would otherwise land off-screen.
 */
export function PaymentSuccess() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollIntoView(ref.current, "center");
  }, []);

  return (
    <div className="payment-success" ref={ref}>
      <div className="payment-success__badge">
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            className="payment-success__check"
            d="M14 27 L23 36 L38 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="payment-success__title">Оплата прошла успешно!</h1>

      <p className="payment-success__text">
        Предзаказ оформлен. Отправка заказа осуществляется в течение 45-60 дней после оплаты. При
        отправке заказа вы получите уведомление на почту, указанную в форме. После этого статус
        заказа можно будет отслеживать в личном кабинете СДЭК.
      </p>

      <a className="payment-success__cta" href={ordersUrl()}>
        Перейти к заказам
      </a>
    </div>
  );
}
