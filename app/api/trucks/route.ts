import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, TruckPublic } from "@/lib/types";

// GET /api/trucks — list all trucks (optionally filter by isLive)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const liveOnly = searchParams.get("live") === "true";

    const trucks = await prisma.truck.findMany({
      where: liveOnly ? { isLive: true } : undefined,
      include: { subscription: true },
      orderBy: { name: "asc" },
    });

    const data: TruckPublic[] = trucks.map((t: { id: string; name: string; cuisineType: string; isLive: boolean; lastLat: number | null; lastLng: number | null }) => ({
      id: t.id,
      name: t.name,
      cuisineType: t.cuisineType,
      isLive: t.isLive,
      lastLat: t.lastLat,
      lastLng: t.lastLng,
    }));

    const response: ApiResponse<TruckPublic[]> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/trucks — register a new truck
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, cuisineType, operatorId } = body;

    if (!name || !cuisineType || !operatorId) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Missing required fields: name, cuisineType, operatorId",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const truck = await prisma.truck.create({
      data: {
        name,
        cuisineType,
        operatorId,
      },
    });

    const response: ApiResponse<typeof truck> = { success: true, data: truck };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
