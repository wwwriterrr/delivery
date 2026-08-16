import type { DeliveryPoint } from "../services/cdekApi";
import { PointSchedule } from "./PointSchedule";
import { PointTypeBadge } from "./PointTypeBadge";

interface Props {
  point: DeliveryPoint;
}

export const SelectedPoint: React.FC<Props> = ({ point }) => {
  const location = point.location;

  return (
    <div className="dp-info">
      <div className="dp-info__name">
        {point.code}
        <PointTypeBadge type={point.type} />
      </div>
      <div className="dp-info__address">{location.address_full ?? location.address}</div>
      {point.phones?.length > 0 && (
        <div className="dp-info__phone">{point.phones.map((p) => p.number).join(", ")}</div>
      )}
      {point.email && <div className="dp-info__address">E-mail: {point.email}</div>}
      <PointSchedule workTimeList={point.work_time_list} className="dp-info" />
    </div>
  );
};
