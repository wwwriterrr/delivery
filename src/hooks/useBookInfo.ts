import { useCallback, useEffect, useState } from "react";
import { fetchBookInfo } from "../services/cdekApi";
import type { BookInfo } from "../services/cdekApi";
import { errorMessage, isAbortError } from "../services/http";

interface BookInfoState {
  book: BookInfo | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export function useBookInfo(slug: string): BookInfoState {
  const [book, setBook] = useState<BookInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchBookInfo(slug, controller.signal)
      .then((data) => {
        setBook(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setBook(null);
        setError(
          errorMessage(err, {
            notFound: "Такой книги нет — возможно, предзаказ уже завершён или ссылка устарела.",
            server: "Не удалось загрузить информацию о книге. Попробуйте через несколько минут.",
          })
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [slug, attempt]);

  return { book, error, loading, reload };
}
