import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ErrorState } from "../components/ErrorState";
import "../App.css";

export function PayFailPage() {
  useDocumentTitle("Оплата не прошла");

  return (
    <div className="app">
      <h1 className="app__title">Оплата не прошла</h1>
      <ErrorState message="В процессе оплаты произошла ошибка, деньги не списаны." />
    </div>
  );
}

export default PayFailPage;
