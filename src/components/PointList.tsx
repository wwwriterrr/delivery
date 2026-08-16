import { useEffect, useMemo, useRef, useState } from "react";
import type { DeliveryPoint } from "../services/cdekApi";
import { PointSchedule } from "./PointSchedule";
import "./PointList.css";

const PAGE_SIZE = 40;

interface Props {
  points: DeliveryPoint[];
  selectedUuid: string | null;
  onSelect: (point: DeliveryPoint) => void;
  onConfirm: (point: DeliveryPoint) => void;
}

function addressOf(point: DeliveryPoint): string {
  return point.location.address_full ?? point.location.address ?? "";
}

/**
 * The keyboard- and screen-reader-accessible way to pick a pickup point.
 * Leaflet markers are not focusable, so without this list the step is
 * unreachable without a mouse — and unusable on a small screen, where the
 * map overlay covers most of the map.
 */
export function PointList({ points, selectedUuid, onSelect, onConfirm }: Props) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const selectedRef = useRef<HTMLLIElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? points.filter(
          (p) =>
            addressOf(p).toLowerCase().includes(needle) ||
            p.code.toLowerCase().includes(needle) ||
            p.nearest_metro_station?.toLowerCase().includes(needle)
        )
      : points;

    // `distance` is only present when the backend knows where the user is.
    return [...matches].sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      return addressOf(a).localeCompare(addressOf(b), "ru");
    });
  }, [points, query]);

  useEffect(() => setVisible(PAGE_SIZE), [query, points]);

  // Keep a point picked on the map in view within the list.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedUuid]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="point-list">
      <label className="point-list__search-label" htmlFor="point-search">
        Поиск по адресу или метро
      </label>
      <input
        id="point-search"
        className="point-list__search"
        type="search"
        placeholder="Например, Ленина или Тверская"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="point-list__count" role="status" aria-live="polite">
        {filtered.length === 0
          ? "Ничего не найдено"
          : `Найдено пунктов: ${filtered.length}`}
      </div>

      <ul className="point-list__items">
        {shown.map((point) => {
          const isSelected = point.uuid === selectedUuid;
          return (
            <li
              key={point.uuid}
              ref={isSelected ? selectedRef : null}
              className={`point-list__item ${isSelected ? "point-list__item--selected" : ""}`}
            >
              <button
                className="point-list__button"
                type="button"
                aria-expanded={isSelected}
                onClick={() => onSelect(point)}
              >
                <span className="point-list__code">{point.code}</span>
                <span className="point-list__address">{addressOf(point)}</span>
                {point.nearest_metro_station && (
                  <span className="point-list__metro">м. {point.nearest_metro_station}</span>
                )}
                {point.distance != null && (
                  <span className="point-list__distance">{point.distance} км</span>
                )}
              </button>

              {isSelected && (
                <div className="point-list__details">
                  {point.work_time && (
                    <div className="point-list__work-time">{point.work_time}</div>
                  )}
                  {point.phones?.length > 0 && (
                    <div className="point-list__phone">
                      {point.phones.map((p) => p.number).join(", ")}
                    </div>
                  )}
                  <PointSchedule workTimeList={point.work_time_list} />
                  <button
                    className="point-list__confirm"
                    type="button"
                    onClick={() => onConfirm(point)}
                  >
                    Выбрать этот пункт
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length > visible && (
        <button
          className="point-list__more"
          type="button"
          onClick={() => setVisible((n) => n + PAGE_SIZE)}
        >
          Показать ещё ({filtered.length - visible})
        </button>
      )}
    </div>
  );
}
