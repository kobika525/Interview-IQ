import { useState, useRef, useCallback } from 'react'

export function useMediaRecorder(stream) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const start = useCallback(() => {
    if (!stream || !window.MediaRecorder) return
    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioUrl(URL.createObjectURL(blob))
    }
    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }, [stream])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }, [])

  const reset = useCallback(() => {
    setAudioUrl(null)
    setSeconds(0)
  }, [])

  return { recording, seconds, audioUrl, start, stop, reset }
}
