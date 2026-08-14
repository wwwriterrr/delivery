import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";
import type { DeliveryPoint } from "../services/cdekApi";
import "./DeliveryMap.css";

// Custom SVG marker icon
const svgIcon = (selected: boolean = false) =>
  L.divIcon({
    className: "",
    html: `
      <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${selected ? "#245326" : "#E9AA44"}" stroke="#fff" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="#fff"/>
      </svg>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });

// Cluster icon
const clusterIcon = (count: number) =>
  L.divIcon({
    className: "",
    html: `<div class="cluster-marker">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

interface Props {
  points: DeliveryPoint[];
  center: [number, number] | null;
  selectedUuid: string | null;
  onSelect: (point: DeliveryPoint) => void;
  onConfirm: (point: DeliveryPoint) => void;
  onDeselect: () => void;
}

const ReCenter: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 1 });
  }, [center, map]);
  return null;
};

// Component to add markers to cluster group
const ClusterMarkers: React.FC<{
  points: DeliveryPoint[];
  selectedUuid: string | null;
  onSelect: (point: DeliveryPoint) => void;
}> = ({ points, selectedUuid, onSelect }) => {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const childCount = cluster.getChildCount();
        return clusterIcon(childCount);
      },
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
    });

    points.forEach((point) => {
      const lat = point.location.latitude;
      const lng = point.location.longitude;
      if (!lat || !lng) return;

      const isSelected = point.uuid === selectedUuid;
      const marker = L.marker([lat, lng], {
        icon: svgIcon(isSelected),
      });

      marker.on("click", () => {
        onSelect(point);
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [points, selectedUuid, map, onSelect]);

  return null;
};

// Panel overlay showing point info on top of the map
const PointInfoOverlay: React.FC<{
  point: DeliveryPoint;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ point, onConfirm, onClose }) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const location = point.location;
  const workTimeList = point.work_time_list ?? [];

  return (
    <div className="map-point-overlay">
      <button className="map-point-overlay__close" onClick={onClose} type="button">
        ✕
      </button>
      <div className="map-point-overlay__name">{point.code}</div>
      <div className="map-point-overlay__address">
        {location.address_full ?? location.address}
      </div>
      {point.phones?.length > 0 && (
        <div className="map-point-overlay__phone">
          {point.phones.map((p) => p.number).join(", ")}
        </div>
      )}
      {point.work_time && (
        <div className="map-point-overlay__time">{point.work_time}</div>
      )}
      {workTimeList.length > 0 && (
        <div className="map-point-overlay__schedule-block">
          <button
            className="map-point-overlay__schedule-toggle"
            onClick={() => setScheduleOpen((v) => !v)}
            type="button"
          >
            {scheduleOpen ? "Скрыть" : "Расписание"}
          </button>
          {scheduleOpen && (
            <div className="map-point-overlay__schedule">
              {workTimeList.map((wt, idx) => (
                <div key={idx}>
                  <span className="map-point-overlay__day">
                    {["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"][wt.day ?? 0] ?? `День ${wt.day}`}
                  </span>{" "}
                  — {wt.time}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button className="map-point-overlay__confirm" onClick={onConfirm} type="button">
        Выбрать пункт
      </button>
    </div>
  );
};

export const DeliveryMap: React.FC<Props> = ({
  points,
  center,
  selectedUuid,
  onSelect,
  onConfirm,
  onDeselect,
}) => {
  if (!center || points.length === 0) return null;

  const selectedPoint = selectedUuid
    ? points.find((p) => p.uuid === selectedUuid) ?? null
    : null;

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <ReCenter center={center} />
        <ClusterMarkers
          points={points}
          selectedUuid={selectedUuid}
          onSelect={onSelect}
        />
      </MapContainer>
      {selectedPoint && (
        <PointInfoOverlay
          point={selectedPoint}
          onConfirm={() => onConfirm(selectedPoint)}
          onClose={onDeselect}
        />
      )}
    </div>
  );
};
