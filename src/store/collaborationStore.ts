import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UUID, ISO8601 } from '@/types';

// ============================================================
// Types
// ============================================================

export interface PresenceUser {
  userId:      UUID;
  displayName: string;
  avatar:      string | null;
  color:       string;       // Unique color per user in session
  currentView: string | null;
  entityType:  string | null;
  entityId:    UUID | null;
  cursor?:     { x: number; y: number };
  isTyping:    boolean;
  lastSeenAt:  ISO8601;
}

export interface ActiveRoom {
  roomId:  string;
  users:   PresenceUser[];
  joinedAt: ISO8601;
}

interface CollaborationState {
  isConnected:    boolean;
  isConnecting:   boolean;
  socketId:       string | null;
  rooms:          Record<string, ActiveRoom>;
  onlineUsers:    Record<UUID, PresenceUser>;
  typingUsers:    Record<string, UUID[]>;  // key: "entityType:entityId"
  connectionError: string | null;
  reconnectAttempt: number;

  setConnected:      (connected: boolean, socketId?: string) => void;
  setConnecting:     (connecting: boolean) => void;
  joinRoom:          (roomId: string) => void;
  leaveRoom:         (roomId: string) => void;
  updatePresence:    (user: PresenceUser) => void;
  removePresence:    (userId: UUID) => void;
  updateRoomUsers:   (roomId: string, users: PresenceUser[]) => void;
  setTyping:         (entityType: string, entityId: UUID, userId: UUID, isTyping: boolean) => void;
  setConnectionError:(error: string | null) => void;
  setReconnectAttempt: (attempt: number) => void;
  clearCollaboration: () => void;

  // Selectors
  getRoomUsers:      (roomId: string) => PresenceUser[];
  getEntityTyping:   (entityType: string, entityId: UUID) => UUID[];
  isUserOnline:      (userId: UUID) => boolean;
}

// ============================================================
// Presence colors (distinct colors for each user)
// ============================================================

export const PRESENCE_COLORS = [
  '#4F46E5', '#7C3AED', '#DC2626', '#059669',
  '#D97706', '#0284C7', '#BE185D', '#0891B2',
  '#65A30D', '#EA580C', '#6D28D9', '#047857',
];

export function getPresenceColor(index: number): string {
  return PRESENCE_COLORS[index % PRESENCE_COLORS.length] ?? PRESENCE_COLORS[0]!;
}

// ============================================================
// Store
// ============================================================

export const useCollaborationStore = create<CollaborationState>()(
  devtools(
    immer((set, get) => ({
      isConnected:     false,
      isConnecting:    false,
      socketId:        null,
      rooms:           {},
      onlineUsers:     {},
      typingUsers:     {},
      connectionError: null,
      reconnectAttempt: 0,

      setConnected: (connected, socketId) => {
        set((s) => {
          s.isConnected    = connected;
          s.isConnecting   = false;
          s.socketId       = socketId ?? null;
          if (connected) {
            s.connectionError     = null;
            s.reconnectAttempt    = 0;
          }
        });
      },

      setConnecting: (connecting) => {
        set((s) => { s.isConnecting = connecting; });
      },

      joinRoom: (roomId) => {
        set((s) => {
          if (!s.rooms[roomId]) {
            s.rooms[roomId] = {
              roomId,
              users: [],
              joinedAt: new Date().toISOString(),
            };
          }
        });
      },

      leaveRoom: (roomId) => {
        set((s) => {
          delete s.rooms[roomId];
        });
      },

      updatePresence: (user) => {
        set((s) => {
          s.onlineUsers[user.userId] = user;
        });
      },

      removePresence: (userId) => {
        set((s) => {
          delete s.onlineUsers[userId];
          // Also remove from rooms
          Object.values(s.rooms).forEach((room) => {
            room.users = room.users.filter((u) => u.userId !== userId);
          });
          // Remove from typing
          Object.keys(s.typingUsers).forEach((key) => {
            const users = s.typingUsers[key];
            if (users) {
              s.typingUsers[key] = users.filter((id) => id !== userId);
            }
          });
        });
      },

      updateRoomUsers: (roomId, users) => {
        set((s) => {
          if (s.rooms[roomId]) {
            s.rooms[roomId]!.users = users;
          }
          // Update online users map
          users.forEach((u) => {
            s.onlineUsers[u.userId] = u;
          });
        });
      },

      setTyping: (entityType, entityId, userId, isTyping) => {
        const key = `${entityType}:${entityId}`;
        set((s) => {
          const users = s.typingUsers[key] ?? [];
          if (isTyping && !users.includes(userId)) {
            s.typingUsers[key] = [...users, userId];
          } else if (!isTyping) {
            s.typingUsers[key] = users.filter((id) => id !== userId);
          }
        });
      },

      setConnectionError: (error) => {
        set((s) => { s.connectionError = error; });
      },

      setReconnectAttempt: (attempt) => {
        set((s) => { s.reconnectAttempt = attempt; });
      },

      clearCollaboration: () => {
        set((s) => {
          s.rooms          = {};
          s.onlineUsers    = {};
          s.typingUsers    = {};
          s.isConnected    = false;
          s.isConnecting   = false;
          s.socketId       = null;
        });
      },

      // ── Computed ───────────────────────────────────────────

      getRoomUsers: (roomId) => {
        return get().rooms[roomId]?.users ?? [];
      },

      getEntityTyping: (entityType, entityId) => {
        const key = `${entityType}:${entityId}`;
        return get().typingUsers[key] ?? [];
      },

      isUserOnline: (userId) => {
        return userId in get().onlineUsers;
      },
    })),
    { name: 'CollaborationStore' }
  )
);
