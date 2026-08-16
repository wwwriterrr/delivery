import type { BookInfo } from "../services/cdekApi";
import { resolveImageUrl } from "../utils/media";
import { bukaLabel } from "../utils/format";
import { IconCoin } from "./IconCoin";
import "./BookCard.css";

interface Props {
  book: BookInfo;
  authenticated: boolean;
}

export function BookCard({ book, authenticated }: Props) {
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
          <div className="book-card__author">Автор: {book.author}</div>
          <div className="book-card__price">
            {book.price}{" "}
            {authenticated ? (
              <IconCoin width={18} height={20} role="img" aria-label={bukaLabel(book.price)} />
            ) : (
              "₽"
            )}
          </div>
        </div>
      </div>
      <div className="book-card__description">{book.description}</div>
    </div>
  );
}
