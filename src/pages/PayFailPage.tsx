import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ErrorState } from "../components/ErrorState";
import { ordersUrl } from "../routes/paths";
import "../App.css";

export function PayFailPage() {
  useDocumentTitle("Оплата не прошла");

  return (
    <div className="app">
      <h1 className="app__title">Оплата не прошла</h1>
      <ErrorState
        message="В процессе оплаты произошла ошибка, деньги не списаны. Попробуйте оформить предзаказ ещё раз — если ошибка повторится, напишите в поддержку."
        action={
          <a className="error-state__link" href={ordersUrl()}>
            Мои заказы
          </a>
        }
      />
    </div>
  );
}

export default PayFailPage;
