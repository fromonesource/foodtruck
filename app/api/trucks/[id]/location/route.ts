import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";
import type { ApiResponse, TruckLocation } from "@/lib/types";

// POST /api/trucks/[id]/location — update GPS, persist to gps_events, trigger Pusher
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { lat, lng } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      const response: ApiResponse<never> = {
        success: false,
        error: "Missing required fields: lat (number), lng (number)",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verify truck exists
    const truck = await prisma.truck.findUnique({ where: { id } });
    if (!truck) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Truck not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Persist GPS event
    const gpsEvent = await prisma.gpsEvent.create({
      data: { lat, lng, truckId: id },
    });

    // Update truck's last known position
    await prisma.truck.update({
      where: { id },
      data: { lastLat: lat, lastLng: lng },
    });

    // Trigger Pusher event
    const locationData: TruckLocation = {
      truckId: id,
      lat,
      lng,
      timestamp: gpsEvent.createdAt.toISOString(),
    };

    await pusherServer.trigger(
      `truck-${id}`,
      "location-updated",
      locationData
    );

    // Also trigger on the global channel for the public map
    await pusherServer.trigger("trucks-live", "location-updated", locationData);

    const response: ApiResponse<TruckLocation> = {
      success: true,
      data: locationData,
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
