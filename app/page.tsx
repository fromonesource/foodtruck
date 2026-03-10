import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">TruckSpot</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/map" className="text-gray-500 hover:text-gray-700">
              Live Map
            </Link>
            <Link
              href="/operator"
              className="text-gray-500 hover:text-gray-700"
            >
              Operators
            </Link>
            <Link
              href="/pricing"
              className="text-gray-500 hover:text-gray-700"
            >
              Pricing
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 text-center py-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Real-Time Food Truck
            <br />
            Tracking Platform
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            GPS broadcasting, demand heatmaps, and reroute intelligence.
            Built for food truck operators and POS resellers.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/map"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition text-lg"
            >
              Find Trucks Near You
            </Link>
            <Link
              href="/operator"
              className="bg-white text-gray-700 px-8 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition text-lg"
            >
              Operator Dashboard
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-3">GPS</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Live Tracking
              </h3>
              <p className="text-sm text-gray-600">
                10-second GPS updates broadcast to customers in real time via
                WebSocket events.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-red-500 mb-3">MAP</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Demand Heatmaps
              </h3>
              <p className="text-sm text-gray-600">
                Transaction-based clustering shows where demand is highest.
                Available on Pro+.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-3">POS</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                POS Integration
              </h3>
              <p className="text-sm text-gray-600">
                Webhook API lets any POS system push transactions for
                location-tagged analytics.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          TruckSpot — GPS tracking and demand intelligence for food trucks.{" "}
          <Link href="/pricing" className="underline">
            Reseller pricing
          </Link>
        </div>
      </footer>
    </div>
  );
}
