import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";
import type { DeliveryPoint } from "../services/cdekApi";
import { PointSchedule } from "./PointSchedule";
import { PointTypeBadge } from "./PointTypeBadge";
import { POINT_KIND_LABEL, pointKind } from "../utils/points";
import type { PointKind } from "../utils/points";
import "./DeliveryMap.css";

/**
 * Both kinds keep the same pin silhouette so the map reads as one family; only
 * the glyph inside changes — a dot for a staffed point, locker rows for a
 * postamat. Colour stays reserved for selection, never for the type.
 */
const svgIcon = (kind: PointKind, selected: boolean = false) => {
  const fill = selected ? "#245326" : "#E9AA44";
  const glyph =
    kind === "postamat"
      ? `<rect x="9.5" y="9" width="9" height="10" rx="1.5" fill="#fff"/>
         <path d="M9.5 12.33h9M9.5 15.66h9" stroke="${fill}" stroke-width="1.2"/>`
      : `<circle cx="14" cy="14" r="5" fill="#fff"/>`;

  return L.divIcon({
    className: "",
    html: `
      <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${fill}" stroke="#fff" stroke-width="2"/>
        ${glyph}
      </svg>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
};

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

/** Brings a point chosen from the list into view without yanking the map on every map click. */
const PanToSelected: React.FC<{ point: DeliveryPoint | null }> = ({ point }) => {
  const map = useMap();
  useEffect(() => {
    const lat = point?.location.latitude;
    const lng = point?.location.longitude;
    if (lat == null || lng == null) return;
    const latLng = L.latLng(lat, lng);
    if (!map.getBounds().contains(latLng)) map.panTo(latLng, { duration: 0.5 });
  }, [point, map]);
  return null;
};

const ClusterMarkers: React.FC<{
  points: DeliveryPoint[];
  selectedUuid: string | null;
  onSelect: (point: DeliveryPoint) => void;
}> = ({ points, selectedUuid, onSelect }) => {
  const map = useMap();
  const markersRef = useRef<Map<string, { marker: L.Marker; kind: PointKind }>>(new Map());
  const previousSelectedRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Building the cluster layer is expensive (hundreds of markers in Moscow),
  // so it depends on `points` only — never on the current selection.
  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      iconCreateFunction: (cluster: L.MarkerCluster) => clusterIcon(cluster.getChildCount()),
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
    });

    const markers = new Map<string, { marker: L.Marker; kind: PointKind }>();
    points.forEach((point) => {
      const lat = point.location.latitude;
      const lng = point.location.longitude;
      if (!lat || !lng) return;

      const kind = pointKind(point.type);
      const marker = L.marker([lat, lng], {
        icon: svgIcon(kind, false),
        title: point.location.address_full ?? point.location.address,
        alt: `${POINT_KIND_LABEL[kind]} ${point.code}`,
      });
      marker.on("click", () => onSelectRef.current(point));
      markers.set(point.uuid, { marker, kind });
      clusterGroup.addLayer(marker);
    });

    markersRef.current = markers;
    previousSelectedRef.current = null;
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
      markersRef.current = new Map();
    };
  }, [points, map]);

  // Selection changes repaint at most two icons instead of rebuilding the layer.
  useEffect(() => {
    const markers = markersRef.current;
    const previous = previousSelectedRef.current;

    if (previous && previous !== selectedUuid) {
      const entry = markers.get(previous);
      entry?.marker.setIcon(svgIcon(entry.kind, false));
    }
    if (selectedUuid) {
      const entry = markers.get(selectedUuid);
      entry?.marker.setIcon(svgIcon(entry.kind, true));
    }
    previousSelectedRef.current = selectedUuid;
  }, [selectedUuid, points]);

  return null;
};

// Panel overlay showing point info on top of the map
const PointInfoOverlay: React.FC<{
  point: DeliveryPoint;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ point, onConfirm, onClose }) => {
  const location = point.location;

  return (
    <div className="map-point-overlay">
      <button
        className="map-point-overlay__close"
        onClick={onClose}
        type="button"
        aria-label="Закрыть информацию о пункте"
      >
        ✕
      </button>
      <div className="map-point-overlay__name">
        {point.code}
        <PointTypeBadge type={point.type} />
      </div>
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
      <PointSchedule workTimeList={point.work_time_list} className="map-point-overlay" />
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
        <PanToSelected point={selectedPoint} />
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

export default DeliveryMap;
