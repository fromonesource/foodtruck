"use client";

interface RerouteBannerProps {
  hotspotLat: number;
  hotspotLng: number;
  distanceMiles: number;
  transactionCount: number;
}

export default function RerouteBanner({
  hotspotLat,
  hotspotLng,
  distanceMiles,
  transactionCount,
}: RerouteBannerProps) {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <svg
          className="h-5 w-5 text-amber-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.345 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-amber-800">
          Reroute Suggestion
        </h3>
        <p className="text-sm text-amber-700 mt-1">
          A hotspot with <span className="font-bold">{transactionCount} recent sales</span> detected{" "}
          <span className="font-bold">{distanceMiles.toFixed(2)} miles</span> away
          at ({hotspotLat.toFixed(4)}, {hotspotLng.toFixed(4)}).
          Consider moving to increase sales volume.
        </p>
      </div>
    </div>
  );
}
