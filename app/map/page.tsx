"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MapWrapper from "@/components/MapContainer";
import TruckMarker from "@/components/TruckMarker";
import SlideUpDrawer from "@/components/SlideUpDrawer";
import { getPusherClient } from "@/lib/pusher-client";
import { haversineDistance } from "@/lib/geo";
import type { TruckPublic, TruckLocation } from "@/lib/types";

function CustomerMapInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cuisineFilter = searchParams.get("cuisine") || "";

  const [trucks, setTrucks] = useState<TruckPublic[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<TruckPublic | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);

  // Get followed trucks from localStorage
  const getFollowedTrucks = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("followedTrucks") || "[]");
    } catch {
      return [];
    }
  }, []);

  const toggleFollow = useCallback(
    (truckId: string) => {
      const followed = getFollowedTrucks();
      const updated = followed.includes(truckId)
        ? followed.filter((id: string) => id !== truckId)
        : [...followed, truckId];
      localStorage.setItem("followedTrucks", JSON.stringify(updated));
    },
    [getFollowedTrucks]
  );

  const isFollowing = useCallback(
    (truckId: string): boolean => {
      return getFollowedTrucks().includes(truckId);
    },
    [getFollowedTrucks]
  );

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Austin
          setUserLocation({ lat: 30.2672, lng: -97.7431 });
        }
      );
    } else {
      setUserLocation({ lat: 30.2672, lng: -97.7431 });
    }
  }, []);

  // Fetch live trucks
  useEffect(() => {
    async function fetchTrucks() {
      try {
        const res = await fetch("/api/trucks?live=true");
        const json = await res.json();
        if (json.success) {
          setTrucks(json.data);
          const types = Array.from(
            new Set(json.data.map((t: TruckPublic) => t.cuisineType))
          ) as string[];
          setCuisineTypes(types);
        }
      } catch (err) {
        console.error("Failed to fetch trucks:", err);
      }
    }

    fetchTrucks();
    const interval = setInterval(fetchTrucks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to Pusher for live updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe("trucks-live");

    channel.bind("location-updated", (data: TruckLocation) => {
      setTrucks((prev) =>
        prev.map((t) =>
          t.id === data.truckId
            ? { ...t, lastLat: data.lat, lastLng: data.lng }
            : t
        )
      );

      // Proximity notification for followed trucks
      const followed = getFollowedTrucks();
      if (followed.includes(data.truckId) && userLocation) {
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          data.lat,
          data.lng
        );
        if (dist <= 0.5) {
          const truck = trucks.find((t) => t.id === data.truckId);
          if (truck && "Notification" in window && Notification.permission === "granted") {
            new Notification(`${truck.name} is nearby!`, {
              body: `${truck.name} (${truck.cuisineType}) is ${dist.toFixed(2)} miles from you.`,
            });
          }
        }
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [userLocation, trucks, getFollowedTrucks]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      await Notification.requestPermission();
    }
  };

  const filteredTrucks = cuisineFilter
    ? trucks.filter(
        (t) => t.cuisineType.toLowerCase() === cuisineFilter.toLowerCase()
      )
    : trucks;

  const handleCuisineFilter = (cuisine: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cuisine) {
      params.set("cuisine", cuisine);
    } else {
      params.delete("cuisine");
    }
    router.push(`/map?${params.toString()}`);
  };

  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [30.2672, -97.7431];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            TruckSpot{" "}
            <span className="text-gray-400 font-normal text-sm">
              Food Trucks Near You
            </span>
          </h1>
          <nav className="flex gap-4 text-sm">
            <a href="/operator" className="text-gray-500 hover:text-gray-700">
              Operators
            </a>
            <a href="/pricing" className="text-gray-500 hover:text-gray-700">
              Pricing
            </a>
          </nav>
        </div>
      </header>

      {/* Cuisine filter bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-sm text-gray-500 flex-shrink-0">Filter:</span>
          <button
            onClick={() => handleCuisineFilter("")}
            className={`px-3 py-1 rounded-full text-sm transition ${
              !cuisineFilter
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {cuisineTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleCuisineFilter(type)}
              className={`px-3 py-1 rounded-full text-sm transition flex-shrink-0 ${
                cuisineFilter === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MapWrapper center={mapCenter} zoom={13} className="h-[600px] w-full rounded-xl shadow-sm">
          {filteredTrucks.map(
            (truck) =>
              truck.lastLat &&
              truck.lastLng && (
                <TruckMarker
                  key={truck.id}
                  lat={truck.lastLat}
                  lng={truck.lastLng}
                  name={truck.name}
                  cuisineType={truck.cuisineType}
                  isLive={truck.isLive}
                  onClick={() => {
                    setSelectedTruck(truck);
                    setDrawerOpen(true);
                  }}
                />
              )
          )}
        </MapWrapper>

        <p className="text-center text-sm text-gray-400 mt-3">
          {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? "s" : ""}{" "}
          live
        </p>
      </div>

      {/* Slide-up drawer */}
      <SlideUpDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {selectedTruck && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedTruck.name}
              </h2>
              <p className="text-gray-500">{selectedTruck.cuisineType}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  selectedTruck.isLive ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span
                className={`text-sm ${
                  selectedTruck.isLive ? "text-green-600" : "text-gray-400"
                }`}
              >
                {selectedTruck.isLive ? "Currently Live" : "Off Duty"}
              </span>
            </div>

            {selectedTruck.lastLat && selectedTruck.lastLng && userLocation && (
              <p className="text-sm text-gray-500">
                {haversineDistance(
                  userLocation.lat,
                  userLocation.lng,
                  selectedTruck.lastLat,
                  selectedTruck.lastLng
                ).toFixed(2)}{" "}
                miles from you
              </p>
            )}

            <button
              onClick={() => {
                toggleFollow(selectedTruck.id);
                requestNotificationPermission();
                // Force re-render
                setSelectedTruck({ ...selectedTruck });
              }}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition ${
                isFollowing(selectedTruck.id)
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isFollowing(selectedTruck.id)
                ? "Following - Notifications On"
                : "Notify Me When Nearby"}
            </button>
          </div>
        )}
      </SlideUpDrawer>
    </div>
  );
}

export default function CustomerMap() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <span className="text-gray-400">Loading map...</span>
        </div>
      }
    >
      <CustomerMapInner />
    </Suspense>
  );
}
