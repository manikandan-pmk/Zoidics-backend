import { NextRequest, NextResponse } from "next/server";
import { LeadCampaignRepo } from "@/lib/repository";


export async function GET(_request: NextRequest) {
  try {
    const campaigns = await LeadCampaignRepo.find({
      order: {
        createdAt: "DESC",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: campaigns,
      },
      // 2. Instruct the browser and CDN not to cache this response
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("campaigns error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch campaigns",
      },
      {
        status: 500,
      }
    );
  }
}