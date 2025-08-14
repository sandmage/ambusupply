import type { NextRequest } from "next/server"
import { getApiContext, createErrorResponse } from "@/lib/api-utils"

// GET /api/notifications/stream - Server-Sent Events for real-time notifications
export async function GET(request: NextRequest) {
  const context = getApiContext(request)
  if (!context) {
    return createErrorResponse("Unauthorized", 401)
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder()
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", message: "Connected to notification stream" })}\n\n`,
        ),
      )

      // Store the controller for this user's stream
      global.notificationStreams = global.notificationStreams || new Map()
      global.notificationStreams.set(context.userId, controller)

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        global.notificationStreams?.delete(context.userId)
        try {
          controller.close()
        } catch (error) {
          // Stream already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
