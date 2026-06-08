import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'

// ============================================================
// Socket Event Types
// ============================================================

export interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  emit: <T = unknown>(event: string, data?: T) => void
  subscribe: <T = unknown>(event: string, handler: (data: T) => void) => () => void
}

// ============================================================
// Context
// ============================================================

const SocketContext = createContext<SocketContextValue | null>(null)

import { WS_PATH, WS_RECONNECT_ATTEMPTS, WS_RECONNECT_DELAY } from '@/config/constants'

// Empty string → socket.io connects to current origin (dev proxy handles it)
const SOCKET_URL = import.meta.env.VITE_WS_URL || undefined
const SOCKET_PATH = WS_PATH
const RECONNECT_ATTEMPTS = WS_RECONNECT_ATTEMPTS
const RECONNECT_DELAY = WS_RECONNECT_DELAY

// ============================================================
// Provider
// ============================================================

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps): React.JSX.Element {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // ── React 19 Strict Mode guard ────────────────────────────────────────────
    // In development, React mounts → (cleanup) → remounts each component.
    // By using autoConnect:false and deferring socket.connect() via
    // queueMicrotask, the first-mount cleanup runs before the socket ever
    // attempts to open a WebSocket, eliminating the "closed before connection
    // is established" browser warning.
    let cancelled = false

    const socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      autoConnect: false,   // We trigger connect manually below
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    socket.on('connect', () => {
      console.debug('[Socket] Connected:', socket.id)
      setIsConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.debug('[Socket] Disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.debug('[Socket] Connection error:', err.message)
      setIsConnected(false)
    })

    socket.on('reconnect', (attempt: number) => {
      console.debug('[Socket] Reconnected after', attempt, 'attempts')
      setIsConnected(true)
    })

    socketRef.current = socket

    // Defer the actual connection so Strict Mode's first-mount cleanup can
    // cancel it before any WebSocket handshake begins.
    queueMicrotask(() => {
      if (!cancelled) {
        socket.connect()
      }
    })

    return () => {
      cancelled = true
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  const joinRoom = useCallback((room: string): void => {
    socketRef.current?.emit('join:room', { room })
  }, [])

  const leaveRoom = useCallback((room: string): void => {
    socketRef.current?.emit('leave:room', { room })
  }, [])

  const emit = useCallback(<T = unknown>(event: string, data?: T): void => {
    socketRef.current?.emit(event, data)
  }, [])

  const subscribe = useCallback(<T = unknown>(
    event: string,
    handler: (data: T) => void,
  ): (() => void) => {
    const socket = socketRef.current
    if (!socket) return () => {}

    socket.on(event, handler as (...args: unknown[]) => void)
    return () => {
      socket.off(event, handler as (...args: unknown[]) => void)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, joinRoom, leaveRoom, emit, subscribe }}>
      {children}
    </SocketContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext)
  if (!ctx) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return ctx
}
