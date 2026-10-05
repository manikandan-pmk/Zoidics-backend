import { NextRequest, NextResponse } from "next/server";

import { ChatSession } from "../../../../entities/ChatSession";
import { ChatMessage } from "../../../../entities/ChatMessage";
import { connectDatabase } from "../../../../lib/database";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const sessionId = Number(id);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid chat session ID",
        },
        {
          status: 400,
        },
      );
    }

    const database = await connectDatabase();

    const sessionRepository = database.getRepository(ChatSession);
    const messageRepository = database.getRepository(ChatMessage);

    // Find chat session
    const session = await sessionRepository.findOne({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat session not found",
        },
        {
          status: 404,
        },
      );
    }

    // Find all messages for this session
    const messages = await messageRepository.find({
      where: {
        sessionId: session.id,
      },
      order: {
        createdAt: "ASC",
      },
    });

    return NextResponse.json({
      success: true,

      chat: {
        id: session.id,

        name: session.name,
        email: session.email,
        phone: session.phone,

        service: session.service,
        requirement: session.requirement,

        timeline: session.timeline,
        budget: session.budget,

        status: session.status,

        createdAt: session.createdAt,
        updatedAt: session.updatedAt,

        messages,
      },
    });
  } catch (error) {
    console.error("GET chatbot lead by ID error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chatbot conversation",
      },
      {
        status: 500,
      },
    );
  }
}