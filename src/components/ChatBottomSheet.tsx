"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MutableRefObject,
  type KeyboardEvent,
} from "react";
import { Sparkles, Search, X, ChevronDown } from "lucide-react";
import ChatBubble, { type ChatMessageData } from "./ChatBubble";
import type maplibregl from "maplibre-gl";

// ── Types ────────────────────────────────────────────────────────────────────

type SnapPoint = "peek" | "half" | "full";

interface ChatBottomSheetProps {
  mapRef: MutableRefObject<maplibregl.Map | null>;
}

// ── SSE Parser ───────────────────────────────────────────────────────────────

interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

function parseSSE(raw: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const blocks = raw.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    let eventType = "";
    let eventData = "";

    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7);
      } else if (line.startsWith("data: ")) {
        eventData = line.slice(6);
      }
    }

    if (eventType && eventData) {
      try {
        events.push({ type: eventType, data: JSON.parse(eventData) });
      } catch {
        /* ignore malformed JSON */
      }
    }
  }

  return events;
}

// ── Snap Heights ─────────────────────────────────────────────────────────────

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  peek: "68px",
  half: "40vh",
  full: "85vh",
};

// ── Marker helpers ───────────────────────────────────────────────────────────

function createSearchMarker(
  maplibre: typeof maplibregl,
  emoji: string,
  color: string,
  map: maplibregl.Map,
  lng: number,
  lat: number,
  title: string
): maplibregl.Marker {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 36px; height: 36px;
    background: ${color};
    border: 2px solid white;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; cursor: pointer;
    box-shadow: 0 2px 12px rgba(139, 92, 246, 0.4);
    animation: markerPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  `;
  el.textContent = emoji;
  el.onmouseenter = () => {
    el.style.transform = "scale(1.3)";
  };
  el.onmouseleave = () => {
    el.style.transform = "scale(1)";
  };

  const popup = new maplibre.Popup({ offset: 20, closeButton: false }).setHTML(
    `<div style="font-family:system-ui;min-width:140px">
      <div style="font-weight:700;font-size:13px">${emoji} ${title}</div>
    </div>`
  );

  return new maplibre.Marker({ element: el })
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ChatBottomSheet({ mapRef }: ChatBottomSheetProps) {
  const [snap, setSnap] = useState<SnapPoint>("peek");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchMarkersRef = useRef<maplibregl.Marker[]>([]);
  const dragState = useRef<{
    startY: number;
    startH: number;
    dragging: boolean;
  } | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Map integration: fly to location ─────────────────────────────────────

  const handleLocate = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
      // Shrink sheet to half so user can see map
      if (snap === "full") setSnap("half");
    },
    [mapRef, snap]
  );

  // ── Clear search markers ─────────────────────────────────────────────────

  const clearSearchMarkers = useCallback(() => {
    searchMarkersRef.current.forEach((m) => m.remove());
    searchMarkersRef.current = [];
  }, []);

  // ── Add markers from tool results ────────────────────────────────────────

  const addMarkersFromResults = useCallback(
    async (
      toolName: string,
      data: Record<string, unknown>
    ) => {
      const map = mapRef.current;
      if (!map) return;

      // Dynamic import maplibre for marker creation
      const maplibre = await import("maplibre-gl");

      const items: { lat: number; lng: number; name: string; type: string }[] =
        [];

      if (toolName === "search_places") {
        const places = (data.places as { lat: number; lng: number; name: string; place_type: string }[]) || [];
        places.forEach((p) => {
          if (p.lat && p.lng) items.push({ ...p, name: p.name, type: p.place_type });
        });
      } else if (toolName === "search_missions") {
        const missions = (data.missions as { lat?: number; lng?: number; title: string; quest_type: string }[]) || [];
        missions.forEach((m) => {
          if (m.lat && m.lng)
            items.push({ lat: m.lat, lng: m.lng, name: m.title, type: m.quest_type });
        });
      }

      if (items.length === 0) return;

      // Clear previous search markers
      clearSearchMarkers();

      // Add new markers
      items.forEach((item) => {
        const marker = createSearchMarker(
          maplibre,
          "⭐",
          "#8b5cf6",
          map,
          item.lng,
          item.lat,
          item.name
        );
        searchMarkersRef.current.push(marker);
      });

      // Fly to first result
      map.flyTo({
        center: [items[0].lng, items[0].lat],
        zoom: 13,
        duration: 2000,
      });
    },
    [mapRef, clearSearchMarkers]
  );

  // ── Send message to AI Agent ─────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMessageData = {
        id: `user_${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      if (snap === "peek") setSnap("half");

      // Build history for API (only user + assistant text messages)
      const history = [...messages, userMsg]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      try {
        const response = await fetch("/api/ai-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to connect to AI Agent");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (delimited by double newlines)
          const events = parseSSE(buffer);
          // Keep any incomplete trailing data in the buffer
          const lastDoubleNewline = buffer.lastIndexOf("\n\n");
          if (lastDoubleNewline >= 0) {
            buffer = buffer.slice(lastDoubleNewline + 2);
          }

          for (const event of events) {
            switch (event.type) {
              case "thinking":
                // Thinking indicator handled by isStreaming state
                break;

              case "tool_call":
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `tc_${Date.now()}_${Math.random()}`,
                    role: "tool_call",
                    content:
                      (event.data.label as string) ||
                      `🔧 ${event.data.tool}…`,
                    toolName: event.data.tool as string,
                    timestamp: Date.now(),
                  },
                ]);
                break;

              case "tool_result":
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `tr_${Date.now()}_${Math.random()}`,
                    role: "tool_result",
                    content: "",
                    toolName: event.data.tool as string,
                    toolData: event.data.data as Record<string, unknown>,
                    timestamp: Date.now(),
                  },
                ]);
                // Add map markers for location-based results
                if (
                  event.data.tool === "search_places" ||
                  event.data.tool === "search_missions"
                ) {
                  addMarkersFromResults(
                    event.data.tool as string,
                    event.data.data as Record<string, unknown>
                  );
                }
                break;

              case "text":
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `ai_${Date.now()}`,
                    role: "assistant",
                    content: (event.data.content as string) || "",
                    timestamp: Date.now(),
                  },
                ]);
                break;

              case "error":
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `err_${Date.now()}`,
                    role: "assistant",
                    content: `⚠️ ${event.data.message || "Something went wrong."}`,
                    timestamp: Date.now(),
                  },
                ]);
                break;

              case "done":
                break;
            }
          }
        }
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: `⚠️ ${e instanceof Error ? e.message : "Connection failed. Please try again."}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, snap, addMarkersFromResults]
  );

  // ── Keyboard handler ─────────────────────────────────────────────────────

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    } else if (e.key === "Escape") {
      setSnap("peek");
      inputRef.current?.blur();
    }
  };

  // ── Drag gestures ────────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent) => {
    if (!sheetRef.current) return;
    dragState.current = {
      startY: e.clientY,
      startH: sheetRef.current.offsetHeight,
      dragging: true,
    };
    sheetRef.current.style.transition = "none";
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current?.dragging || !sheetRef.current) return;
    const deltaY = dragState.current.startY - e.clientY;
    const newH = Math.max(68, Math.min(window.innerHeight * 0.9, dragState.current.startH + deltaY));
    sheetRef.current.style.height = `${newH}px`;
  };

  const onPointerUp = () => {
    if (!dragState.current?.dragging || !sheetRef.current) return;
    dragState.current.dragging = false;
    sheetRef.current.style.transition = "";
    const h = sheetRef.current.offsetHeight;
    const vh = window.innerHeight;
    if (h < vh * 0.15) setSnap("peek");
    else if (h < vh * 0.6) setSnap("half");
    else setSnap("full");
  };

  // ── Close handler ────────────────────────────────────────────────────────

  const handleClose = () => {
    setSnap("peek");
    inputRef.current?.blur();
  };

  // ── Focus input = expand ─────────────────────────────────────────────────

  const handleInputFocus = () => {
    if (snap === "peek" && messages.length > 0) {
      setSnap("half");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* CSS animation for marker pop-in */}
      <style jsx global>{`
        @keyframes markerPop {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden"
        style={{
          height: SNAP_HEIGHTS[snap],
          borderRadius: "20px 20px 0 0",
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 -4px 30px rgba(0, 0, 0, 0.1)",
          transition: "height 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* ── Drag Handle ────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="w-9 h-[5px] rounded-full bg-black/15" />
        </div>

        {/* ── Header (visible when expanded) ─────────────────────────── */}
        {snap !== "peek" && (
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-amber-400 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800">
                PawPal AI
              </span>
            </div>
            <div className="flex items-center gap-1">
              {snap === "full" && (
                <button
                  onClick={() => setSnap("half")}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                  title="Collapse"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Messages area ──────────────────────────────────────────── */}
        {snap !== "peek" && (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 pb-2 scroll-smooth"
            style={{ minHeight: 0 }}
          >
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-amber-100 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Ask me anything about pets
                </p>
                <p className="text-xs text-gray-400 max-w-[240px]">
                  Find vets, check food safety, explore breeds, or discover
                  missions on the map
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onLocate={handleLocate}
              />
            ))}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex justify-start mb-3">
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-amber-400 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex gap-1 px-3 py-2 rounded-2xl bg-white/90 border border-gray-100 shadow-sm">
                    <div
                      className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Input bar ──────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-3 pb-3 pt-2"
          style={{
            borderTop:
              snap !== "peek" ? "1px solid rgba(0,0,0,0.05)" : "none",
          }}
        >
          {snap === "peek" && (
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 ml-2" />
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="Ask PawPal AI anything…"
            disabled={isStreaming}
            className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm font-light min-w-0 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="bg-gradient-to-r from-amber-500 to-violet-500 hover:from-amber-600 hover:to-violet-600 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-violet-500 text-white px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            {isStreaming ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            {isStreaming ? "Thinking…" : "Ask"}
          </button>
        </div>
      </div>
    </>
  );
}
