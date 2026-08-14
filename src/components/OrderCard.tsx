import { IS_PRODUCTION, BACKEND_URL } from "../constants";
import { IconCoin } from "./IconCoin";
import type { Order } from "../services/cdekApi";
import "./OrdersPage.css";

interface Props {
  order: Order;
  showCoins?: boolean;
}

function resolveImageUrl(url: string | undefined): string {
  if (!url) return "";
  if (IS_PRODUCTION || url.startsWith("http")) return url;
  return BACKEND_URL + url;
}

function formatDate(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Сегодня, ${time}`;
  if (diff === 1) return `Вчера, ${time}`;
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + `, ${time}`;
}

export function OrderCard({ order, showCoins = true }: Props) {
  return (
    <div className="order-card bento-card">
      {order.book?.thumbnail && (
        <img
          className="order-card__thumbnail"
          src={resolveImageUrl(order.book.thumbnail)}
          alt=""
        />
      )}
      <div className="order-card__info">
        <div className="order-card__date">{formatDate(order.dt)}</div>
        {order.book && (
          <>
            <div className="order-card__title">{order.book.name}</div>
            <div className="order-card__author">
              <span className="order-card__label">Автор:</span> {order.book.author}
            </div>
            {order.book.descr && (
              <div className="order-card__descr">{order.book.descr}</div>
            )}
          </>
        )}
        {order.name && (
          <div className="order-card__detail">
            <span className="order-card__label">Получатель:</span> {order.name}, {order.email}, {order.phone}
          </div>
        )}
        {order.delivery_point && (
          <div className="order-card__detail">
            <span className="order-card__label">Пункт выдачи заказа:</span> {order.delivery_point}, {order.delivery_address}
          </div>
        )}
        <div className="order-card__price">
          {order.book?.price} {showCoins ? <IconCoin width={14} height={16} /> : "₽"}
        </div>
      </div>
    </div>
  );
}
