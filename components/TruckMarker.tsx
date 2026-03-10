"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type L from "leaflet";

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface TruckMarkerProps {
  lat: number;
  lng: number;
  name: string;
  cuisineType: string;
  isLive: boolean;
  onClick?: () => void;
}

const truckSvg = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>`;

export default function TruckMarker({
  lat,
  lng,
  name,
  cuisineType,
  isLive,
  onClick,
}: TruckMarkerProps) {
  const [icon, setIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    // Dynamic import of leaflet to avoid window not defined during SSR
    import("leaflet").then((leaflet) => {
      const color = isLive ? "#16a34a" : "#9ca3af";
      const svgUrl = `data:image/svg+xml;base64,${btoa(truckSvg(color))}`;
      setIcon(
        new leaflet.Icon({
          iconUrl: svgUrl,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })
      );
    });
  }, [isLive]);

  if (!icon) return null;

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-bold">{name}</p>
          <p className="text-gray-600">{cuisineType}</p>
          <p className={isLive ? "text-green-600" : "text-gray-400"}>
            {isLive ? "Live" : "Off Duty"}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
