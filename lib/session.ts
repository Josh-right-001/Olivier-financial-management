"use client"

import { v4 as uuidv4 } from "uuid"

const SESSION_KEY = "olivier_session_id"

export function getSessionId(): string {
  if (typeof window === "undefined") return ""

  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}
