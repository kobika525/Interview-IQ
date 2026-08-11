import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Video, VideoOff, Mic, MicOff, Circle, Square, ChevronRight, LogOut, AlertTriangle, Sun, Wifi } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ProgressBar from '../../components/common/ProgressBar'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import QuestionNavigator from '../../components/interview/QuestionNavigator'
import { useCameraPermission } from '../../hooks/useCameraPermission'
import { useMediaRecorder } from '../../hooks/useMediaRecorder'
import { useInterviewSession } from '../../hooks/useInterviewSession'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import ErrorState from '../../components/common/ErrorState'
import { formatDuration } from '../../utils/formatters'
import * as interviewService from '../../services/interviewService'
import toast from 'react-hot-toast'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

const CHECKLIST = ['Face clearly visible', 'Good lighting on your face', 'Quiet background', 'Camera at eye level']

export default function VideoInterview() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { questions, loading, error, reload } = useInterviewSession(id, location.state?.session)
  const [current, setCurrent] = useState(0)
  const [answered, setAnswered] = useState([])
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [exitOpen, setExitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const videoRef = useRef(null)

  const camera = useCameraPermission()
  const recorder = useMediaRecorder(camera.stream)
  const speech = useSpeechRecognition()

  useEffect(() => { camera.request() }, [] ) // eslint-disable-line
  useEffect(() => {
    const savedAnswered = questions
      .map((question, index) => question.isAnswered ? index : null)
      .filter((index) => index !== null)
    setAnswered(savedAnswered)
    const next = questions.findIndex((question) => !question.isAnswered && !question.isSkipped)
    if (next >= 0) setCurrent(next)
  }, [questions])
  useEffect(() => {
    if (videoRef.current && camera.stream) videoRef.current.srcObject = camera.stream
  }, [camera.stream])

  function toggleCam() {
    camera.stream?.getVideoTracks().forEach((t) => (t.enabled = !camOn))
    setCamOn((v) => !v)
  }
  function toggleMic() {
    camera.stream?.getAudioTracks().forEach((t) => (t.enabled = !micOn))
    setMicOn((v) => !v)
  }

  function startRecording() {
    if (!camera.stream?.getAudioTracks().length) {
      toast.error('No microphone track is available. Allow microphone access and reload the page.')
      return
    }
    recorder.start()
    if (speech.supported) speech.start()
  }

  async function nextOrSubmit() {
    setSubmitting(true)
    try {
      const recordedBlob = recorder.recording ? await recorder.stop() : recorder.blob
      speech.stop()
      if (!recordedBlob || recordedBlob.size === 0) {
        toast.error('Record your answer before continuing.')
        return
      }
      if (recorder.seconds < 2) {
        toast.error('Please record for at least 2 seconds before submitting.')
        return
      }
      await interviewService.submitVideoAnswer(id, current + 1, recordedBlob, speech.transcript)
      setAnswered((answers) => [...new Set([...answers, current])])
      if (current < questions.length - 1) {
        setCurrent((question) => question + 1)
        recorder.reset()
        speech.reset()
        toast.success('Answer submitted')
      } else {
        await interviewService.submitInterview(id)
        navigate(`/app/interviews/processing/${id}`)
      }
    } catch (error) {
      toast.error(error.message || 'Unable to submit the video answer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && questions.length === 0) return <SkeletonLoader rows={4} />
  if (error && questions.length === 0) return <ErrorState title="Unable to load interview" message={error.message} onRetry={reload} />
  if (questions.length === 0) return <ErrorState title="No interview questions" message="This session has no saved questions." onRetry={reload} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary">Video Interview</h1>
          <p className="text-xs text-text-muted mt-0.5">Question {current + 1} of {questions.length}</p>
        </div>
        <Button variant="ghost" icon={LogOut} onClick={() => setExitOpen(true)}>Exit</Button>
      </div>
      <ProgressBar value={((current + 1) / questions.length) * 100} className="mb-6" />

      {(camera.status === 'denied' || camera.status === 'unsupported') && (
        <Card className="mb-5 border-error/30 flex items-center gap-3">
          <AlertTriangle size={18} className="text-error shrink-0" />
          <p className="text-sm text-text-secondary">
            {camera.status === 'denied' ? 'Camera/microphone access was denied. Please allow permissions to continue.' : "Your browser doesn't support video recording. Try Chrome or Edge."}
          </p>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {camera.stream && camOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <VideoOff size={32} className="text-text-muted" />
              )}
              {recorder.recording && (
                <span className="absolute top-3 left-3 badge bg-error/20 text-error"><Circle size={8} fill="currentColor" />REC {formatDuration(recorder.seconds)}</span>
              )}
              <span className="absolute top-3 right-3 badge bg-black/50 text-white">Question {current + 1}/{questions.length}</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4">
              <button onClick={toggleCam} className={`btn-icon !w-11 !h-11 ${!camOn && 'bg-error/10 text-error'}`}>{camOn ? <Video size={18} /> : <VideoOff size={18} />}</button>
              <button onClick={toggleMic} className={`btn-icon !w-11 !h-11 ${!micOn && 'bg-error/10 text-error'}`}>{micOn ? <Mic size={18} /> : <MicOff size={18} />}</button>
              {!recorder.recording ? (
                <Button icon={Circle} disabled={camera.status !== 'granted'} onClick={startRecording}>Start recording</Button>
              ) : (
                <Button variant="coral" icon={Square} onClick={recorder.stop}>Stop</Button>
              )}
              <Button variant="outline" icon={ChevronRight} loading={submitting} disabled={submitting} onClick={nextOrSubmit}>
                {current < questions.length - 1 ? 'Next question' : 'Submit interview'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex gap-2 mb-3">
              <Badge tone="warning">{questions[current].difficulty}</Badge>
              <Badge tone="blue">{questions[current].topic}</Badge>
            </div>
            <p className="text-base text-text-primary leading-relaxed">{questions[current].question}</p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="field-label mb-2.5">Interview checklist</p>
            <ul className="space-y-2">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex items-center gap-2.5 text-sm text-text-secondary"><Sun size={14} className="text-blue shrink-0" />{c}</li>
              ))}
            </ul>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle text-xs text-text-muted">
              <Wifi size={13} className="text-blue" />Camera metrics are calculated after submission.
            </div>
          </Card>
          <Card>
            <QuestionNavigator total={questions.length} current={current} answered={answered} flagged={[]} onSelect={(index) => {
              if (!answered.includes(index) && !questions[index]?.isAnswered) setCurrent(index)
            }} />
          </Card>
        </div>
      </div>

      <ConfirmDialog open={exitOpen} onClose={() => setExitOpen(false)} onConfirm={() => navigate('/app/interviews')} title="Exit interview?" message="Your progress on this session will be lost." confirmLabel="Exit" />
    </div>
  )
}
