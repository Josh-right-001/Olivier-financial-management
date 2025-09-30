"use client"

import { useEffect, useRef, useCallback } from "react"
import { getSessionId } from "./session"

interface AutoSaveOptions {
  debounceMs?: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T, sessionId: string) => Promise<void>,
  options: AutoSaveOptions = {},
) {
  const { debounceMs = 1000, onSuccess, onError } = options
  const timeoutRef = useRef<NodeJS.Timeout>()
  const previousDataRef = useRef<string>()

  const save = useCallback(async () => {
    try {
      const sessionId = getSessionId()
      await saveFunction(data, sessionId)
      onSuccess?.()
    } catch (error) {
      onError?.(error as Error)
    }
  }, [data, saveFunction, onSuccess, onError])

  useEffect(() => {
    const currentData = JSON.stringify(data)

    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) {
      return
    }

    previousDataRef.current = currentData

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, debounceMs, save])

  return { save }
}
