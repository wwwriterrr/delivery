import { useState, useCallback, useRef, useEffect } from "react";
import type { City } from "../services/cdekApi";
import { fetchCities } from "../services/cdekApi";
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
  const [showPopular, setShowPopular] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowPopular(false);
    setIsOpen(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const cities = await fetchCities(value);
        setResults(cities);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleFocus = () => {
    if (!query.trim() && results.length === 0) {
      setShowPopular(true);
      setIsOpen(true);
    }
  };

  const handlePopularSelect = (cityName: string) => {
    setQuery(cityName);
    setIsOpen(false);
    setShowPopular(false);

    setIsLoading(true);
    fetchCities(cityName)
      .then((cities) => {
        if (cities.length > 0) {
          onCitySelect(cities[0]);
        }
        setResults(cities);
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  };

  const handleSelect = useCallback((city: City) => {
    setQuery(city.full_name);
    setResults([]);
    setIsOpen(false);
    onCitySelect(city);
  }, []);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onCitySelect(null);
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div ref={ref} className="city-search">
      <input
        className="city-search__input"
        type="text"
        placeholder="Введите населённый пункт"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
      />
      {isLoading && <div className="spinner" style={{ margin: "12px auto" }} />}
      {isOpen && !isLoading && results.length === 0 && query.trim() && (
        <div className="city-search__not-found">Ничего не найдено по запросу «{query}»</div>
      )}
      {isOpen && showPopular && !query.trim() && (
        <div className="city-dropdown">
          {POPULAR_CITIES.map((city) => (
            <div
              key={city}
              className="city-dropdown__item"
              onClick={() => handlePopularSelect(city)}
            >
              {city}
            </div>
          ))}
        </div>
      )}
      {isOpen && !showPopular && results.length > 0 && (
        <div className="city-dropdown">
          {results.map((city) => (
            <div
              key={city.city_uuid}
              className="city-dropdown__item"
              onClick={() => handleSelect(city)}
            >
              {city.full_name}
            </div>
          ))}
        </div>
      )}
      {selectedCity && (
        <div className="city-selected">
          <span>{selectedCity.full_name}</span>
          <button className="city-selected__clear" onClick={handleClear} type="button">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
