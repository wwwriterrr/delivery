import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ErrorState } from "../components/ErrorState";
import "../App.css";

export function NotFoundPage() {
  useDocumentTitle("Страница не найдена");

  return (
    <div className="app">
      <h1 className="app__title">Страница не найдена</h1>
      <ErrorState message="Такой страницы нет. Возможно, ссылка устарела или в адресе опечатка." />
    </div>
  );
}

export default NotFoundPage;
