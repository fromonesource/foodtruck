import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clusterPoints } from "@/lib/geo";
import type { ApiResponse, HotspotCluster } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/hotspots — return transaction clusters within 0.25 miles,
// count > 1 in the last 2 hours, ranked by volume
export async function GET() {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: twoHoursAgo },
      },
      select: {
        lat: true,
        lng: true,
      },
    });

    const clusters = clusterPoints(
      recentTransactions.map((t: { lat: number; lng: number }) => ({ lat: t.lat, lng: t.lng })),
      0.25
    );

    const hotspots: HotspotCluster[] = clusters.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      count: c.count,
    }));

    const response: ApiResponse<HotspotCluster[]> = {
      success: true,
      data: hotspots,
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
