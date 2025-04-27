"use client"

import { useState } from "react"

/**
 * Status interface for the useInitial hook
 */
interface InitialStatus {
  loading: boolean
  error: boolean
}

/**
 * Custom hook for initializing components in the React Buddy IDE toolbox
 * @returns The current status of the initialization
 */
export const useInitial = (): InitialStatus => {
  const [status, setStatus] = useState<InitialStatus>({
    loading: false,
    error: false,
  })
  
  /*
    Implement hook functionality here.
    If you need to execute async operation, set loading to true and when it's over, set loading to false.
    If you caught some errors, set error status to true.
    Initial hook is considered to be successfully completed if it will return {loading: false, error: false}.
  */
  
  return status
}
