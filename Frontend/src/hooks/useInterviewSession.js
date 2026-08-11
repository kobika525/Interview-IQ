import { useCallback, useEffect, useState } from 'react'
import * as interviewService from '../services/interviewService'

const EMPTY_QUESTIONS = []

export function useInterviewSession(sessionId, initialSession = null) {
  const [session, setSession] = useState(initialSession)
  const [loading, setLoading] = useState(!initialSession)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSession(await interviewService.getInterviewSession(sessionId))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { reload() }, [reload])

  return { session, questions: session?.questions || EMPTY_QUESTIONS, loading, error, reload }
}
