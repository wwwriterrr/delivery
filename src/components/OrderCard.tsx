import { IconCoin } from "./IconCoin";
import type { Order } from "../services/cdekApi";
import { resolveImageUrl } from "../utils/media";
import { bukaLabel, formatOrderDate, tidyAddress } from "../utils/format";
import "./OrderCard.css";

interface Props {
  order: Order;
  showCoins?: boolean;
}

export function OrderCard({ order, showCoins = true }: Props) {
  const book = order.book;
  const contacts = [order.email, order.phone].filter(Boolean).join(" · ");

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

        {book?.author && <p className="order-card__author">
          {book.author_url ? (
            <a href={book.author_url} target="_blank">{book.author}</a>
          ) : (book.author)}
        </p>}

        <p className="order-card__price">
          {book?.price}
          {showCoins ? (
            <IconCoin
              className="order-card__coin"
              width={17}
              height={18}
              role="img"
              aria-label={bukaLabel(book?.price ?? 0)}
            />
          ) : (
            " ₽"
          )}
        </p>
      </div>

      <dl className="order-card__meta">
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
