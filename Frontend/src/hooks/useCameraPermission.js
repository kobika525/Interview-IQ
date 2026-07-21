import { useState, useCallback } from 'react'

export function useCameraPermission() {
  const [status, setStatus] = useState('idle') // idle | granted | denied | unsupported
  const [stream, setStream] = useState(null)

  const request = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return null
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(mediaStream)
      setStatus('granted')
      return mediaStream
    } catch {
      setStatus('denied')
      return null
    }
  }, [])

  const release = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
  }, [stream])

  return { status, stream, request, release }
}
