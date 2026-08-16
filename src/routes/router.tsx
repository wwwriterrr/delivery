// oxlint-disable react/only-export-components -- a router module exports the
// router object next to its layout components; fast refresh falls back to a
// full reload for this one file, which is fine.
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, useRouteError } from "react-router-dom";
import { PATHS } from "./paths";
import { PageLoader } from "../components/PageLoader";
import { ErrorState } from "../components/ErrorState";
import "../App.css";

// One chunk per route: the preorder page pulls in the map stack, the orders
// page does not, and neither is downloaded on the other's URL.
const PreorderPage = lazy(() => import("../pages/PreorderPage"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const PaySuccessPage = lazy(() => import("../pages/PaySuccessPage"));
const PayFailPage = lazy(() => import("../pages/PayFailPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

function RootLayout() {
  return (
    <Suspense
      fallback={
        <div className="app">
          <PageLoader />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}

/** Last line of defence: a render-time crash shows this instead of a blank page. */
function RouteErrorBoundary() {
  const error = useRouteError();

  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="app">
      <h1 className="app__title">Что-то сломалось</h1>
      <ErrorState
        message="Страница не смогла загрузиться. Обновите её — если это не поможет, попробуйте позже."
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: PATHS.preorder, element: <PreorderPage /> },
      { path: PATHS.orders, element: <OrdersPage /> },
      { path: PATHS.paySuccess, element: <PaySuccessPage /> },
      { path: PATHS.payFail, element: <PayFailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
