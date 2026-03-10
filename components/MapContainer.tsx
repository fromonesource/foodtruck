"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainerLeaflet = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

interface MapWrapperProps {
  center: [number, number];
  zoom: number;
  children: React.ReactNode;
  className?: string;
}

export default function MapWrapper({
  center,
  zoom,
  children,
  className = "h-[500px] w-full rounded-lg",
}: MapWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <span className="text-gray-400">Loading map...</span>
      </div>
    );
  }

  return (
    <MapContainerLeaflet
      center={center}
      zoom={zoom}
      className={className}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainerLeaflet>
  );
}
