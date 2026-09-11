import { NextRequest, NextResponse } from "next/server";
import { SignalMessage, SignalType } from "@/lib/webrtc";

interface Participant {
  id: string;
  role: string;
  lastSeen: number;
  controller?: ReadableStreamDefaultController<any>;
}

interface RoomState {
  id: string;
  participants: Map<string, Participant>;
  messages: SignalMessage[];
  lastActivity: number;
}

// Global in-memory storage for signaling across hot reloads in dev & server instances
const globalRooms = (globalThis as any).__rtcRooms || new Map<string, RoomState>();
(globalThis as any).__rtcRooms = globalRooms;

// Auto-cleanup stale rooms every 5 minutes
function cleanupOldRooms() {
  const now = Date.now();
  globalRooms.forEach((room: RoomState, roomId: string) => {
    if (now - room.lastActivity > 1000 * 60 * 30) {
      // 30 min idle
      globalRooms.delete(roomId);
    }
  });
}

function getOrCreateRoom(roomId: string): RoomState {
  cleanupOldRooms();
  if (!globalRooms.has(roomId)) {
    globalRooms.set(roomId, {
      id: roomId,
      participants: new Map(),
      messages: [],
      lastActivity: Date.now(),
    });
  }
  const room = globalRooms.get(roomId)!;
  room.lastActivity = Date.now();
  return room;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("room") || "default-teleconsult";
  const sender = searchParams.get("sender") || `user-${Math.random().toString(36).substring(2, 8)}`;
  const role = searchParams.get("role") || "Doctor";
  const since = parseInt(searchParams.get("since") || "0", 10);
  const isSSE =
    req.headers.get("accept")?.includes("text/event-stream") ||
    searchParams.get("stream") === "true";

  const room = getOrCreateRoom(roomId);

  if (!isSSE) {
    // Polling fallback
    const newMessages = room.messages.filter(
      (m) => m.timestamp > since && m.sender !== sender
    );
    const existing = room.participants.get(sender);
    if (existing) {
      existing.lastSeen = Date.now();
    } else {
      room.participants.set(sender, { id: sender, role, lastSeen: Date.now() });
    }
    return NextResponse.json({
      success: true,
      messages: newMessages,
      participantsCount: room.participants.size,
    });
  }

  // Server-Sent Events (SSE) Stream
  const encoder = new TextEncoder();
  let keepAliveInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Register participant with SSE controller
      room.participants.set(sender, {
        id: sender,
        role,
        lastSeen: Date.now(),
        controller,
      });

      // Send initial welcome & connection confirmation
      const welcomeMsg = `data: ${JSON.stringify({
        type: "ready",
        room: roomId,
        sender: "system",
        senderRole: "System",
        data: { participantsCount: room.participants.size },
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(welcomeMsg));

      // Replay any recent pending messages (e.g. offers or joins from other peer)
      const pending = room.messages.filter(
        (m) => m.timestamp > since && m.sender !== sender
      );
      for (let i = 0; i < pending.length; i++) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(pending[i])}\n\n`));
      }

      // Broadcast peer-joined to other participants in the room
      room.participants.forEach((p, pId) => {
        if (pId !== sender && p.controller) {
          try {
            const peerJoinMsg = `data: ${JSON.stringify({
              id: `join-${Date.now()}`,
              room: roomId,
              sender,
              senderRole: role,
              type: "peer-joined",
              data: { sender, role },
              timestamp: Date.now(),
            })}\n\n`;
            p.controller.enqueue(encoder.encode(peerJoinMsg));
          } catch (e) {
            // client disconnected
          }
        }
      });

      // Heartbeat every 15s to keep connection alive
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
        }
      }, 15000);
    },
    cancel() {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      const participant = room.participants.get(sender);
      if (participant) {
        room.participants.delete(sender);
      }

      // Broadcast peer-left to remaining participants
      room.participants.forEach((p, pId) => {
        if (pId !== sender && p.controller) {
          try {
            const peerLeaveMsg = `data: ${JSON.stringify({
              id: `leave-${Date.now()}`,
              room: roomId,
              sender,
              senderRole: role,
              type: "peer-left",
              data: { sender, role },
              timestamp: Date.now(),
            })}\n\n`;
            p.controller.enqueue(encoder.encode(peerLeaveMsg));
          } catch (e) {
            // ignore
          }
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { room: roomId, sender, senderRole, type, data } = body;

    if (!roomId || !sender || !type) {
      return NextResponse.json(
        { error: "Missing required fields: room, sender, type" },
        { status: 400 }
      );
    }

    const room = getOrCreateRoom(roomId);
    const msg: SignalMessage = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      room: roomId,
      sender,
      senderRole: senderRole || "User",
      type: type as SignalType,
      data,
      timestamp: Date.now(),
    };

    // Keep message history (limit to last 50)
    room.messages.push(msg);
    if (room.messages.length > 50) {
      room.messages.shift();
    }

    // Push to active SSE streams of other participants in the room
    const encoder = new TextEncoder();
    const payload = `data: ${JSON.stringify(msg)}\n\n`;

    room.participants.forEach((p, pId) => {
      if (pId !== sender && p.controller) {
        try {
          p.controller.enqueue(encoder.encode(payload));
        } catch (e) {
          room.participants.delete(pId);
        }
      }
    });

    return NextResponse.json({ success: true, messageId: msg.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("room");
  const sender = searchParams.get("sender");

  if (roomId && globalRooms.has(roomId)) {
    const room = globalRooms.get(roomId)!;
    if (sender) {
      room.participants.delete(sender);
    }
    if (!sender || room.participants.size === 0) {
      globalRooms.delete(roomId);
    }
  }
  return NextResponse.json({ success: true });
}
