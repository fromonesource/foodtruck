import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, TransactionInput } from "@/lib/types";

// POST /api/transactions — log a POS sale with GPS coordinate
export async function POST(req: NextRequest) {
  try {
    const body: TransactionInput = await req.json();
    const { itemName, price, lat, lng, truckId } = body;

    if (!itemName || typeof price !== "number" || typeof lat !== "number" || typeof lng !== "number" || !truckId) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Missing required fields: itemName, price, lat, lng, truckId",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verify truck exists
    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Truck not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        itemName,
        price,
        lat,
        lng,
        truckId,
      },
    });

    const response: ApiResponse<typeof transaction> = {
      success: true,
      data: transaction,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
