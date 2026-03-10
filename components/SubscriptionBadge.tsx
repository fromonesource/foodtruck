"use client";

import type { SubscriptionTier } from "@/lib/types";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
}

const tierConfig: Record<
  SubscriptionTier,
  { label: string; bg: string; text: string }
> = {
  basic: { label: "Basic", bg: "bg-gray-100", text: "text-gray-700" },
  pro: { label: "Pro", bg: "bg-blue-100", text: "text-blue-700" },
  enterprise: {
    label: "Enterprise",
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
};

export default function SubscriptionBadge({ tier }: SubscriptionBadgeProps) {
  const config = tierConfig[tier];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
