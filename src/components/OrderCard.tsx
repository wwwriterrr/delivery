import type { Order } from "../services/cdekApi";
import { resolveImageUrl } from "../utils/media";
import { bookLabel, formatOrderDate, tidyAddress } from "../utils/format";
import { Price } from "./Price";
import "./OrderCard.css";

interface Props {
  order: Order;
  showCoins?: boolean;
}

export function OrderCard({ order, showCoins = true }: Props) {
  const book = order.book;
  const contacts = [order.email, order.phone].filter(Boolean).join(" · ");

  const quantity = order.quantity;
  const unitPrice = book?.price ?? 0;

  return (
    <article className="order-card">
      {book?.thumbnail && (
        <img
          className="order-card__cover"
          src={resolveImageUrl(book.thumbnail)}
          alt={`Обложка книги «${book.name}»`}
          width={88}
          height={128}
          loading="lazy"
        />
      )}

      <div className="order-card__head">
        <div className="order-card__eyebrow">
          <time className="order-card__date">{formatOrderDate(order.dt)}</time>
          {order.status && <span className="order-card__status">{order.status}</span>}
        </div>

        <h3 className="order-card__title">{book?.name}</h3>

        {book?.author && (
          <p className="order-card__author">
            {book.author_url ? (
              <a
                className="order-card__author-link"
                href={book.author_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {book.author}
              </a>
            ) : (
              book.author
            )}
          </p>
        )}

        {/* Placed top-right on wide screens by grid, last on narrow ones, while
            the DOM keeps the order a screen reader should hear. The amount is
            what was actually paid, so it is the total rather than the price of
            one copy; the arithmetic behind it sits underneath. */}
        <p className="order-card__amount">
          <Price
            className="order-card__price"
            value={unitPrice * quantity}
            coins={showCoins}
            iconWidth={17}
            iconHeight={18}
          />
          {quantity > 1 && (
            <span className="order-card__breakdown">
              {quantity} × {unitPrice}
            </span>
          )}
        </p>
      </div>

      <dl className="order-card__meta">
        {quantity > 1 && (
          <div className="order-card__row">
            <dt className="order-card__label">Сколько</dt>
            <dd className="order-card__value">
              {quantity} {bookLabel(quantity)}
            </dd>
          </div>
        )}

        {order.name && (
          <div className="order-card__row">
            <dt className="order-card__label">Кому</dt>
            <dd className="order-card__value">
              {order.name}
              {contacts && <span className="order-card__contacts">{contacts}</span>}
            </dd>
          </div>
        )}

        {order.delivery_point && (
          <div className="order-card__row">
            <dt className="order-card__label">Куда</dt>
            <dd className="order-card__value">
              <span className="order-card__code">{order.delivery_point}</span>
              {order.delivery_address && (
                <span className="order-card__address">{tidyAddress(order.delivery_address)}</span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
