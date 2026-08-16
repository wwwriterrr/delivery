import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ErrorState } from "../components/ErrorState";
import { ordersUrl } from "../routes/paths";
import "../App.css";

export function NotFoundPage() {
  useDocumentTitle("Страница не найдена");

  return (
    <div className="app">
      <h1 className="app__title">Страница не найдена</h1>
      <ErrorState
        message="Такой страницы нет. Возможно, ссылка устарела или в адресе опечатка."
        action={
          <a className="error-state__link" href={ordersUrl()}>
            Мои заказы
          </a>
        }
      />
    </div>
  );
}

export default NotFoundPage;
