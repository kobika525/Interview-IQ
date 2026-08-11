import { useState, useRef, useCallback } from 'react'

export function useMediaRecorder(stream) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [blob, setBlob] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const start = useCallback(() => {
    if (!stream || !window.MediaRecorder) return
    chunksRef.current = []
    setBlob(null)
    const preferredType = stream.getVideoTracks().length
      ? 'video/webm;codecs=vp8,opus'
      : 'audio/webm'
    const mimeType = MediaRecorder.isTypeSupported(preferredType) ? preferredType : ''
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = null
    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }, [stream])

  const stop = useCallback(() => {
    const activeRecorder = recorderRef.current
    if (!activeRecorder || activeRecorder.state === 'inactive') return Promise.resolve(blob)
    return new Promise((resolve) => {
      activeRecorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, { type: activeRecorder.mimeType || 'video/webm' })
        setBlob(recordedBlob)
        setAudioUrl(URL.createObjectURL(recordedBlob))
        setRecording(false)
        clearInterval(timerRef.current)
        resolve(recordedBlob)
      }
      activeRecorder.stop()
    })
  }, [blob])

  const reset = useCallback(() => {
    setAudioUrl(null)
    setBlob(null)
    setSeconds(0)
  }, [])

  return { recording, seconds, audioUrl, blob, start, stop, reset }
}
