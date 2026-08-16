import { useState, useCallback, useRef, useEffect } from "react";
import type { City } from "../services/cdekApi";
import { fetchCities } from "../services/cdekApi";
import { errorMessage, isAbortError } from "../services/http";
import { POPULAR_CITIES } from "../constants";

interface Props {
  onCitySelect: (city: City | null) => void;
  selectedCity: City | null;
}

export const CitySearch: React.FC<Props> = ({ onCitySelect, selectedCity }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopular, setShowPopular] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  /** Cancels both the pending debounce and any request already in flight. */
  const cancelPending = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);

  const runSearch = useCallback(
    (value: string, onDone?: (cities: City[]) => void) => {
      cancelPending();
      const controller = new AbortController();
      requestRef.current = controller;

      setIsLoading(true);
      setError(null);

      fetchCities(value, controller.signal)
        .then((cities) => {
          setResults(cities);
          setIsOpen(true);
          setIsLoading(false);
          onDone?.(cities);
        })
        .catch((err: unknown) => {
          if (isAbortError(err)) return;
          // Staying silent here reads as "no such city", which is misleading.
          setResults([]);
          setError(errorMessage(err, { server: "Не удалось найти город. Попробуйте ещё раз." }));
          setIsOpen(true);
          setIsLoading(false);
        });
    },
    [cancelPending]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowPopular(false);
    setIsOpen(false);
    setError(null);
    cancelPending();

    if (!value.trim()) {
      setResults([]);
      return;
    }

    timeoutRef.current = setTimeout(() => runSearch(value), 300);
  };

  const handleFocus = () => {
    if (!query.trim() && results.length === 0) {
      setShowPopular(true);
      setIsOpen(true);
    }
  };

  const handleSelect = useCallback(
    (city: City) => {
      setQuery(city.full_name);
      setResults([]);
      setIsOpen(false);
      onCitySelect(city);
    },
    [onCitySelect]
  );

  const handlePopularSelect = (cityName: string) => {
    setQuery(cityName);
    setShowPopular(false);
    runSearch(cityName, (cities) => {
      if (cities.length > 0) {
        setIsOpen(false);
        onCitySelect(cities[0]);
      }
    });
  };

  const handleClear = () => {
    cancelPending();
    setQuery("");
    setResults([]);
    setError(null);
    setIsOpen(false);
    onCitySelect(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setShowPopular(false);
      return;
    }
    // Enter inside a form would submit it; here it picks the top match instead.
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && !showPopular && results.length > 0) handleSelect(results[0]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowPopular(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const listboxId = "city-search-listbox";

  return (
    <div ref={ref} className="city-search">
      <input
        className="city-search__input"
        type="text"
        placeholder="Введите населённый пункт"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label="Населённый пункт"
        autoComplete="off"
      />

      {isLoading && (
        <div className="spinner" style={{ margin: "12px auto" }} role="status" aria-label="Поиск городов" />
      )}

      {error && (
        <div className="city-search__error" role="alert">
          {error}
        </div>
      )}

      {isOpen && !isLoading && !error && results.length === 0 && query.trim() && (
        <div className="city-search__not-found">Ничего не найдено по запросу «{query}»</div>
      )}

      {isOpen && showPopular && !query.trim() && (
        <ul className="city-dropdown" id={listboxId} role="listbox" aria-label="Популярные города">
          {POPULAR_CITIES.map((city) => (
            <li key={city} role="option" aria-selected={false}>
              <button
                className="city-dropdown__item"
                type="button"
                onClick={() => handlePopularSelect(city)}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !showPopular && results.length > 0 && (
        <ul className="city-dropdown" id={listboxId} role="listbox" aria-label="Найденные города">
          {results.map((city) => (
            <li key={city.code} role="option" aria-selected={selectedCity?.code === city.code}>
              <button
                className="city-dropdown__item"
                type="button"
                onClick={() => handleSelect(city)}
              >
                {city.full_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedCity && (
        <div className="city-selected">
          <span>{selectedCity.full_name}</span>
          <button
            className="city-selected__clear"
            onClick={handleClear}
            type="button"
            aria-label={`Сбросить город ${selectedCity.full_name}`}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
