import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

// ============================================================
// Types
// ============================================================

export interface UseWebSocketOptions {
  /** Namespace to connect to (default: '/') */
  namespace?: string
  /** Rooms to join on connect */
  rooms?: string[]
  /** Whether to auto-connect (default: true) */
  autoConnect?: boolean
  /** Maximum reconnection attempts (default: 5) */
  reconnectionAttempts?: number
}

export interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  subscribe: <T = unknown>(event: string, handler: (data: T) => void) => () => void
  unsubscribe: (event: string, handler: (...args: unknown[]) => void) => void
  emit: <T = unknown>(event: string, data?: T) => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  connect: () => void
  disconnect: () => void
}

// ============================================================
// Hook
// ============================================================

const SOCKET_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'http://localhost:5469'
const SOCKET_PATH = (import.meta.env.VITE_WS_PATH as string | undefined) ?? '/socket.io'

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    namespace = '/',
    rooms = [],
    autoConnect = true,
    reconnectionAttempts = 5,
  } = options

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const accessToken = useAuthStore((s) => s.tokens?.accessToken ?? null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Track active rooms so we can rejoin on reconnect
  const activeRoomsRef = useRef<Set<string>>(new Set(rooms))

  const socketUrl = namespace === '/' ? SOCKET_URL : `${SOCKET_URL}${namespace}`

  // ── Connect ──────────────────────────────────────────────

  const connect = useCallback((): void => {
    if (socketRef.current?.connected) return
    if (!isAuthenticated || !accessToken) return

    const socket = io(socketUrl, {
      path: SOCKET_PATH,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
    })

    socket.on('connect', () => {
      if (import.meta.env.DEV) {
        console.debug(`[WS] Connected to ${socketUrl} (${socket.id})`)
      }
      setIsConnected(true)

      // Rejoin any rooms after reconnect
      activeRoomsRef.current.forEach((room) => {
        socket.emit('join:room', { room })
      })
    })

    socket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) {
        console.debug(`[WS] Disconnected: ${reason}`)
      }
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      if (import.meta.env.DEV) {
        console.error(`[WS] Connection error: ${err.message}`)
      }
      setIsConnected(false)
    })

    socket.on('reconnect', (attempt: number) => {
      if (import.meta.env.DEV) {
        console.debug(`[WS] Reconnected after ${attempt} attempt(s)`)
      }
      setIsConnected(true)
    })

    socketRef.current = socket
  }, [socketUrl, accessToken, isAuthenticated, reconnectionAttempts])

  // ── Disconnect ───────────────────────────────────────────

  const disconnect = useCallback((): void => {
    socketRef.current?.disconnect()
    socketRef.current = null
    setIsConnected(false)
  }, [])

  // ── Auto-connect on mount ────────────────────────────────

  useEffect(() => {
    if (autoConnect && isAuthenticated && accessToken) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, isAuthenticated, accessToken, connect, disconnect])

  // ── Room Management ──────────────────────────────────────

  const joinRoom = useCallback((room: string): void => {
    activeRoomsRef.current.add(room)
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:room', { room })
    }
  }, [])

  const leaveRoom = useCallback((room: string): void => {
    activeRoomsRef.current.delete(room)
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:room', { room })
    }
  }, [])

  // ── Emit ────────────────────────────────────────────────

  const emit = useCallback(<T = unknown>(event: string, data?: T): void => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`[WS] Cannot emit '${event}': socket not connected`)
    }
  }, [])

  // ── Subscribe ────────────────────────────────────────────

  const subscribe = useCallback(<T = unknown>(
    event: string,
    handler: (data: T) => void,
  ): (() => void) => {
    const socket = socketRef.current
    if (!socket) {
      console.warn(`[WS] Cannot subscribe to '${event}': socket not initialized`)
      return () => {}
    }

    const wrappedHandler = handler as (...args: unknown[]) => void
    socket.on(event, wrappedHandler)

    // Return unsubscribe function
    return () => {
      socket.off(event, wrappedHandler)
    }
  }, [])

  // ── Unsubscribe ──────────────────────────────────────────

  const unsubscribe = useCallback(
    (event: string, handler: (...args: unknown[]) => void): void => {
      socketRef.current?.off(event, handler)
    },
    [],
  )

  return {
    socket: socketRef.current,
    isConnected,
    subscribe,
    unsubscribe,
    emit,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
  }
}

// ============================================================
// Specialized hooks
// ============================================================

/**
 * Subscribe to project-scoped real-time events
 */
export function useProjectSocket(projectId: string): UseWebSocketReturn {
  const ws = useWebSocket({ rooms: [`project:${projectId}`] })

  useEffect(() => {
    if (!projectId) return
    ws.joinRoom(`project:${projectId}`)
    return () => {
      ws.leaveRoom(`project:${projectId}`)
    }
  }, [projectId, ws.joinRoom, ws.leaveRoom])

  return ws
}

/**
 * Subscribe to a single event with automatic cleanup
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: unknown[] = [],
): void {
  const { subscribe } = useWebSocket()

  useEffect(() => {
    const unsubscribe = subscribe<T>(event, handler)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, subscribe, ...deps])
}
