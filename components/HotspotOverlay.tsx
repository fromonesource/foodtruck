"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

interface HotspotOverlayProps {
  hotspots: { lat: number; lng: number; count: number }[];
}

export default function HotspotOverlay({ hotspots }: HotspotOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {hotspots.map((h, i) => (
        <CircleMarker
          key={i}
          center={[h.lat, h.lng]}
          radius={Math.min(h.count * 8, 40)}
          pathOptions={{
            color: "#ef4444",
            fillColor: "#f87171",
            fillOpacity: 0.4,
            weight: 2,
          }}
        >
          <Tooltip>
            {h.count} transactions in this area
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
