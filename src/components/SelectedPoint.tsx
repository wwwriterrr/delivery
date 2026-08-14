import { useState } from "react";
import type { DeliveryPoint } from "../services/cdekApi";

interface Props {
  point: DeliveryPoint;
}

const dayNames = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

export const SelectedPoint: React.FC<Props> = ({ point }) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const location = point.location;
  const workTimeList = point.work_time_list ?? [];

  return (
    <div className="dp-info">
      <div className="dp-info__name">{point.code}</div>
      <div className="dp-info__address">{location.address_full ?? location.address}</div>
      {point.phones?.length > 0 && (
        <div className="dp-info__phone">{point.phones.map((p) => p.number).join(", ")}</div>
      )}
      {point.email && <div className="dp-info__address">E-mail: {point.email}</div>}
      {workTimeList.length > 0 && (
        <div className="dp-info__schedule-block">
          <button
            className="dp-info__schedule-toggle"
            onClick={() => setScheduleOpen((v) => !v)}
            type="button"
          >
            {scheduleOpen ? "Скрыть" : "Расписание"}
          </button>
          {scheduleOpen && (
            <div className="dp-info__schedule">
              {workTimeList.map((wt, idx) => (
                <div key={idx}>
                  <span className="dp-info__schedule-day">
                    {dayNames[wt.day ?? 0] ?? `День ${wt.day}`}
                  </span>{" "}
                  — {wt.time}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
