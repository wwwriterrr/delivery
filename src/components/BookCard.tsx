import type { BookInfo } from "../services/cdekApi";
import { resolveImageUrl } from "../utils/media";
import { MAX_BOOKS_PER_ORDER } from "../constants";
import { IconCoin } from "./IconCoin";
import { bukaLabel } from "../utils/format";
import { ExpandableText } from "./ExpandableText";
import { QuantityPicker } from "./QuantityPicker";
import { Price } from "./Price";
import "./BookCard.css";

interface Props {
  book: BookInfo;
  authenticated: boolean;
  /**
   * When both are given, the card grows a quantity picker under the price and
   * shows what that many copies come to. Left out, the card is the plain
   * read-only description it has always been.
   */
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  maxQuantity?: number;
}

export function BookCard({
  book,
  authenticated,
  quantity,
  onQuantityChange,
  maxQuantity = MAX_BOOKS_PER_ORDER,
}: Props) {
  const picker = quantity !== undefined && onQuantityChange !== undefined;

  return (
    <div className="bento-card book-card">
      <div className="book-card__header">
        {book.thumbnail && (
          <img
            className="book-card__thumbnail"
            src={resolveImageUrl(book.thumbnail)}
            alt={`Обложка книги «${book.title}»`}
            width={96}
            height={140}
          />
        )}
        <div className="book-card__text">
          <div className="book-card__title">{book.title}</div>
          <div className="book-card__author">
            Автор:{" "}
            {book.author_url ? (
              <a
                className="book-card__author-link"
                href={book.author_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {book.author}
              </a>
            ) : (
              book.author
            )}
          </div>
          <div className="book-card__price">
            {book.price}{" "}
            {authenticated ? (
              <IconCoin width={18} height={20} role="img" aria-label={bukaLabel(book.price)} />
            ) : (
              "₽"
            )}
            {picker && <span className="book-card__price-unit">за штуку</span>}
          </div>

          {picker && (
            <div className="book-card__quantity">
              <QuantityPicker
                id="quantity"
                value={quantity}
                onChange={onQuantityChange}
                max={maxQuantity}
              />
              <span className="book-card__total">
                <span className="book-card__total-label">Итого</span>
                <Price
                  className="book-card__total-value"
                  value={book.price * quantity}
                  coins={authenticated}
                />
              </span>
            </div>
          )}
        </div>
      </div>
      <ExpandableText className="book-card__description" text={book.description} />
    </div>
  );
}
