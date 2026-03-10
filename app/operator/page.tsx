"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import MapWrapper from "@/components/MapContainer";
import TruckMarker from "@/components/TruckMarker";
import HotspotOverlay from "@/components/HotspotOverlay";
import RerouteBanner from "@/components/RerouteBanner";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { haversineDistance } from "@/lib/geo";
import type { TruckWithSubscription, HotspotCluster, SubscriptionTier } from "@/lib/types";

interface GpsPosition {
  lat: number;
  lng: number;
}

export default function OperatorDashboard() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("sarah@bbqbus.com");
  const [password, setPassword] = useState("password123");
  const [loginError, setLoginError] = useState("");

  const [truck, setTruck] = useState<TruckWithSubscription | null>(null);
  const [currentPos, setCurrentPos] = useState<GpsPosition | null>(null);
  const [recentPositions, setRecentPositions] = useState<GpsPosition[]>([]);
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
  const [rerouteTarget, setRerouteTarget] = useState<{
    lat: number;
    lng: number;
    distance: number;
    count: number;
  } | null>(null);

  // POS fields
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [posMessage, setPosMessage] = useState("");

  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tier = truck?.subscription?.tier as SubscriptionTier | undefined;
  const isProPlus = tier === "pro" || tier === "enterprise";

  // Fetch operator's truck after login
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    async function fetchTruck() {
      try {
        const res = await fetch("/api/trucks");
        const json = await res.json();
        if (!json.success) return;

        // Find truck belonging to this operator (match by checking each truck)
        // Since we can't easily filter by operator in the list endpoint,
        // we'll fetch all and pick the first one for demo purposes.
        // In production, you'd filter by operator session.
        const trucks = json.data;
        if (trucks.length > 0) {
          // Try to match operator name to truck
          const operatorName = session?.user?.name?.toLowerCase() || "";
          const matched = trucks.find((t: TruckWithSubscription) =>
            t.name.toLowerCase().includes(operatorName.split(" ")[0] || "")
          );
          const truckId = matched?.id || trucks[0].id;

          const detailRes = await fetch(`/api/trucks/${truckId}`);
          const detailJson = await detailRes.json();
          if (detailJson.success) {
            setTruck(detailJson.data);
            if (detailJson.data.lastLat && detailJson.data.lastLng) {
              setCurrentPos({
                lat: detailJson.data.lastLat,
                lng: detailJson.data.lastLng,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch truck:", err);
      }
    }

    fetchTruck();
  }, [status, session]);

  // Start GPS tracking when truck is live
  const startGpsTracking = useCallback(() => {
    if (!truck || !navigator.geolocation) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const pos = { lat: latitude, lng: longitude };
          setCurrentPos(pos);
          setRecentPositions((prev) => [...prev.slice(-4), pos]);

          try {
            await fetch(`/api/trucks/${truck.id}/location`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
          } catch (err) {
            console.error("GPS update failed:", err);
          }
        },
        (err) => {
          // Fall back to simulated movement around Austin
          console.warn("Geolocation error, using simulated position:", err.message);
          const baseLat = truck.lastLat || 30.2672;
          const baseLng = truck.lastLng || -97.7431;
          const pos = {
            lat: baseLat + (Math.random() - 0.5) * 0.002,
            lng: baseLng + (Math.random() - 0.5) * 0.002,
          };
          setCurrentPos(pos);
          setRecentPositions((prev) => [...prev.slice(-4), pos]);

          fetch(`/api/trucks/${truck.id}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pos),
          }).catch(console.error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    };

    sendLocation();
    gpsIntervalRef.current = setInterval(sendLocation, 10000);
  }, [truck]);

  const stopGpsTracking = useCallback(() => {
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
  }, []);

  // Auto-start GPS when truck goes live
  useEffect(() => {
    if (truck?.isLive) {
      startGpsTracking();
    } else {
      stopGpsTracking();
    }
    return () => stopGpsTracking();
  }, [truck?.isLive, startGpsTracking, stopGpsTracking]);

  // Fetch hotspots periodically (Pro+ only)
  useEffect(() => {
    if (!isProPlus) return;

    async function fetchHotspots() {
      try {
        const res = await fetch("/api/hotspots");
        const json = await res.json();
        if (json.success) {
          setHotspots(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch hotspots:", err);
      }
    }

    fetchHotspots();
    const interval = setInterval(fetchHotspots, 30000);
    return () => clearInterval(interval);
  }, [isProPlus]);

  // Reroute detection (Pro+ only)
  useEffect(() => {
    if (!isProPlus || hotspots.length === 0 || recentPositions.length === 0)
      return;

    for (const hotspot of hotspots) {
      const isNearRecent = recentPositions.some(
        (pos) => haversineDistance(pos.lat, pos.lng, hotspot.lat, hotspot.lng) < 0.4
      );

      if (!isNearRecent) {
        // Hotspot outside last 5 positions
        const currentDistance = currentPos
          ? haversineDistance(currentPos.lat, currentPos.lng, hotspot.lat, hotspot.lng)
          : 999;

        if (currentDistance <= 0.4) continue; // Already close enough

        setRerouteTarget({
          lat: hotspot.lat,
          lng: hotspot.lng,
          distance: currentDistance,
          count: hotspot.count,
        });
        return;
      }
    }
    setRerouteTarget(null);
  }, [hotspots, recentPositions, currentPos, isProPlus]);

  // Toggle live status
  const toggleLive = async () => {
    if (!truck) return;
    try {
      const res = await fetch(`/api/trucks/${truck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: !truck.isLive }),
      });
      const json = await res.json();
      if (json.success) {
        setTruck((prev) =>
          prev ? { ...prev, isLive: json.data.isLive } : null
        );
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  // Submit POS sale
  const submitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truck || !currentPos || !itemName || !itemPrice) return;

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName,
          price: parseFloat(itemPrice),
          lat: currentPos.lat,
          lng: currentPos.lng,
          truckId: truck.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPosMessage(`Sale logged: ${itemName} - $${itemPrice}`);
        setItemName("");
        setItemPrice("");
        setTimeout(() => setPosMessage(""), 3000);
      }
    } catch (err) {
      console.error("Sale submission failed:", err);
      setPosMessage("Failed to log sale");
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setLoginError("Invalid email or password");
    }
  };

  // Login screen
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">TruckSpot</h1>
          <p className="text-gray-500 mb-6">Operator Dashboard Login</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {loginError && (
              <p className="text-red-500 text-sm">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-2">
              Test accounts (password: password123)
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>mike@tacoking.com (Basic)</li>
              <li>sarah@bbqbus.com (Pro)</li>
              <li>james@fusionbites.com (Enterprise)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] = currentPos
    ? [currentPos.lat, currentPos.lng]
    : [30.2672, -97.7431];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">TruckSpot</h1>
            {truck && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{truck.name}</span>
                {tier && <SubscriptionBadge tier={tier} />}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Go Live / Off Duty Toggle */}
        {truck && (
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLive}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                truck.isLive
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {truck.isLive ? "Go Off Duty" : "Go Live"}
            </button>
            <span
              className={`inline-flex items-center gap-1.5 text-sm ${
                truck.isLive ? "text-green-600" : "text-gray-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  truck.isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              {truck.isLive ? "Broadcasting GPS" : "Off Duty"}
            </span>
          </div>
        )}

        {/* Reroute Banner (Pro+ only) */}
        {isProPlus && rerouteTarget && (
          <RerouteBanner
            hotspotLat={rerouteTarget.lat}
            hotspotLng={rerouteTarget.lng}
            distanceMiles={rerouteTarget.distance}
            transactionCount={rerouteTarget.count}
          />
        )}

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <MapWrapper center={mapCenter} zoom={14} className="h-[450px] w-full">
            {currentPos && truck && (
              <TruckMarker
                lat={currentPos.lat}
                lng={currentPos.lng}
                name={truck.name}
                cuisineType={truck.cuisineType}
                isLive={truck.isLive}
              />
            )}
            {isProPlus && <HotspotOverlay hotspots={hotspots} />}
          </MapWrapper>
        </div>

        {/* Feature gating notice */}
        {!isProPlus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            Upgrade to <span className="font-semibold">Pro</span> or{" "}
            <span className="font-semibold">Enterprise</span> to unlock heatmap
            overlay and reroute suggestions.{" "}
            <a href="/pricing" className="underline font-medium">
              View plans
            </a>
          </div>
        )}

        {/* Mock POS Panel */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            POS - Log a Sale
          </h2>
          <form
            onSubmit={submitSale}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Brisket Plate"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="12.99"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!currentPos}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log Sale
            </button>
          </form>
          {posMessage && (
            <p className="mt-3 text-sm text-green-600">{posMessage}</p>
          )}
          {!currentPos && (
            <p className="mt-3 text-sm text-gray-400">
              Go live to enable GPS-tagged sales
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
