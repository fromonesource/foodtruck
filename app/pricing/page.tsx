import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TruckSpot - Pricing for POS Resellers",
  description:
    "Embed TruckSpot GPS tracking and demand intelligence into your POS platform. Three tiers for every business.",
};

const tiers = [
  {
    name: "Basic",
    price: "$29",
    period: "/mo per truck",
    description:
      "GPS broadcasting for food trucks. Perfect for POS providers looking to add live location tracking as a value-add feature.",
    features: [
      "Real-time GPS broadcasting",
      "Public customer map listing",
      "10-second position updates",
      "Leaflet-based embeddable map",
      "REST API access",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo per truck",
    description:
      "Full demand intelligence suite. Ideal for POS companies embedding location analytics to reduce churn and increase ARPU.",
    features: [
      "Everything in Basic",
      "Transaction heatmap overlay",
      "Reroute suggestions (demand hotspots)",
      "Hotspot clustering API",
      "Webhook integration for POS events",
      "Priority API rate limits",
    ],
    cta: "Contact Sales",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/mo per truck",
    description:
      "White-label ready with full API control. Built for POS platforms shipping TruckSpot as a native feature under their own brand.",
    features: [
      "Everything in Pro",
      "White-label (custom branding)",
      "POS webhook integration",
      "Dedicated API endpoints",
      "Custom data retention policies",
      "SLA + dedicated support",
      "SSO / SAML support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const webhookSnippet = `// Example: POST a transaction from your POS system
const response = await fetch(
  "https://your-truckspot.vercel.app/api/transactions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer <API_KEY>"
    },
    body: JSON.stringify({
      itemName: "Brisket Plate",
      price: 14.99,
      lat: 30.2672,
      lng: -97.7431,
      truckId: "truck_abc123"
    })
  }
);

const data = await response.json();
// { success: true, data: { id: "txn_...", ... } }`;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">TruckSpot</h1>
          <nav className="flex gap-4 text-sm">
            <a href="/map" className="text-gray-500 hover:text-gray-700">
              Live Map
            </a>
            <a href="/operator" className="text-gray-500 hover:text-gray-700">
              Operators
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Add GPS Tracking to Your POS Platform
          </h2>
          <p className="text-lg text-gray-600">
            TruckSpot integrates with any point-of-sale system. Offer your food
            truck merchants real-time location broadcasting, demand heatmaps,
            and reroute intelligence — all under your brand.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white rounded-xl shadow-sm border-2 p-8 flex flex-col ${
                tier.highlighted
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-gray-100"
              }`}
            >
              {tier.highlighted && (
                <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 self-start">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  {tier.price}
                </span>
                <span className="text-gray-500 text-sm">{tier.period}</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                {tier.description}
              </p>
              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <svg
                      className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full py-3 px-4 rounded-lg font-medium transition ${
                  tier.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Embed code snippet */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gray-900 rounded-xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Embed This Feature
            </h3>
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              JavaScript / TypeScript
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Here&apos;s how your POS system would POST a transaction to the
            TruckSpot webhook endpoint:
          </p>
          <pre className="text-sm text-green-400 overflow-x-auto leading-relaxed">
            <code>{webhookSnippet}</code>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          TruckSpot — GPS tracking and demand intelligence for food trucks.
        </div>
      </footer>
    </div>
  );
}
