import { useId, useState } from "react";
import type { DeliveryPointWorkTime } from "../services/cdekApi";

const DAY_NAMES = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

interface Props {
  workTimeList: DeliveryPointWorkTime[] | undefined;
  className?: string;
}

/** Shared by the map overlay, the point list and the confirmed-point summary. */
export function PointSchedule({ workTimeList, className = "dp-info" }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!workTimeList?.length) return null;

  return (
    <div className={`${className}__schedule-block`}>
      <button
        className={`${className}__schedule-toggle`}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Скрыть расписание" : "Расписание"}
      </button>
      {open && (
        <div className={`${className}__schedule`} id={panelId}>
          {workTimeList.map((wt, idx) => (
            <div key={`${wt.day}-${idx}`}>
              <span className={`${className}__schedule-day`}>
                {DAY_NAMES[wt.day ?? 0] ?? `День ${wt.day}`}
              </span>{" "}
              — {wt.time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
