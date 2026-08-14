import { IS_PRODUCTION, BACKEND_URL } from "../constants";
import { IconCoin } from "./IconCoin";
import "./BookCard.css";

interface BookInfo {
  title: string;
  description: string;
  author: string;
  price: number;
  thumbnail?: string;
}

interface Props {
  book: BookInfo | null;
  authenticated: boolean;
  error: string | null;
}

function resolveImageUrl(url: string | undefined): string {
  if (!url) return "";
  if (IS_PRODUCTION || url.startsWith("http")) return url;
  return BACKEND_URL + url;
}

export function BookCard({ book, authenticated, error }: Props) {
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!book) {
    return (
      <div className="bento-card">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="bento-card book-card">
      <div className="book-card__header">
        {book.thumbnail && (
          <img
            className="book-card__thumbnail"
            src={resolveImageUrl(book.thumbnail)}
            alt=""
          />
        )}
        <div className="book-card__text">
          <div className="book-card__title">{book.title}</div>
          <div className="book-card__author">Автор: {book.author}</div>
          <div className="book-card__price">
            {book.price} {authenticated ? <IconCoin width={18} height={20} /> : "₽"}
          </div>
        </div>
      </div>
      <div className="book-card__description">{book.description}</div>
    </div>
  );
}
