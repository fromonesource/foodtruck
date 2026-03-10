import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, TruckWithSubscription, SubscriptionTier } from "@/lib/types";

// GET /api/trucks/[id] — get truck details with subscription
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const truck = await prisma.truck.findUnique({
      where: { id: params.id },
      include: { subscription: true },
    });

    if (!truck) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Truck not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const data: TruckWithSubscription = {
      id: truck.id,
      name: truck.name,
      cuisineType: truck.cuisineType,
      isLive: truck.isLive,
      lastLat: truck.lastLat,
      lastLng: truck.lastLng,
      subscription: truck.subscription
        ? {
            tier: truck.subscription.tier as SubscriptionTier,
            priceUsd: truck.subscription.priceUsd,
          }
        : null,
    };

    const response: ApiResponse<TruckWithSubscription> = {
      success: true,
      data,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/trucks/[id] — update truck (e.g., toggle isLive)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const truck = await prisma.truck.update({
      where: { id: params.id },
      data: body,
    });

    const response: ApiResponse<typeof truck> = { success: true, data: truck };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
