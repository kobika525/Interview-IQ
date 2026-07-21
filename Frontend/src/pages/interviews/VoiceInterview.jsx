import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Mic, Square, RotateCcw, LogOut, AlertTriangle } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ProgressBar from '../../components/common/ProgressBar'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import QuestionCard from '../../components/interview/QuestionCard'
import WaveformVisualizer from '../../components/interview/WaveformVisualizer'
import { useMicrophonePermission } from '../../hooks/useMicrophonePermission'
import { useMediaRecorder } from '../../hooks/useMediaRecorder'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { getRandomQuestions } from '../../data/interviewQuestions'
import { formatDuration } from '../../utils/formatters'
import * as interviewService from '../../services/interviewService'

export default function VoiceInterview() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [questions] = useState(() => location.state?.session?.questions || getRandomQuestions(5))
  const [current, setCurrent] = useState(0)
  const [exitOpen, setExitOpen] = useState(false)

  const mic = useMicrophonePermission()
  const recorder = useMediaRecorder(mic.stream)
  const speech = useSpeechRecognition()

  useEffect(() => { mic.request() }, []) // eslint-disable-line

  function startRecording() {
    recorder.start()
    if (speech.supported) speech.start()
  }
  function stopRecording() {
    recorder.stop()
    speech.stop()
  }
  function reRecord() {
    recorder.reset()
    speech.reset()
  }

  async function nextOrSubmit() {
    stopRecording()
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
      reRecord()
    } else {
      await interviewService.submitInterview(id)
      navigate(`/app/interviews/processing/${id}`)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary">Voice Interview</h1>
          <p className="text-xs text-text-muted mt-0.5">Question {current + 1} of {questions.length}</p>
        </div>
        <Button variant="ghost" icon={LogOut} onClick={() => setExitOpen(true)}>Exit</Button>
      </div>
      <ProgressBar value={((current + 1) / questions.length) * 100} className="mb-6" />

      {mic.status === 'denied' && (
        <Card className="mb-5 border-error/30 flex items-center gap-3">
          <AlertTriangle size={18} className="text-error shrink-0" />
          <p className="text-sm text-text-secondary">Microphone access was denied. Please allow microphone permissions in your browser settings to continue.</p>
        </Card>
      )}
      {mic.status === 'unsupported' && (
        <Card className="mb-5 border-error/30 flex items-center gap-3">
          <AlertTriangle size={18} className="text-error shrink-0" />
          <p className="text-sm text-text-secondary">Your browser doesn&apos;t support audio recording. Try Chrome or Edge for the voice interview mode.</p>
        </Card>
      )}

      <QuestionCard question={questions[current]} index={current} total={questions.length} />

      <Card className="mt-5 text-center py-8">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-colors ${recorder.recording ? 'bg-cyan/15 animate-pulse-glow' : 'bg-black/[0.045]'}`}>
          <Mic size={30} className={recorder.recording ? 'text-cyan' : 'text-text-muted'} />
        </div>
        <p className="font-mono text-sm text-text-secondary mt-3">{formatDuration(recorder.seconds)}</p>
        <div className="mt-4"><WaveformVisualizer active={recorder.recording} /></div>

        <div className="flex items-center justify-center gap-3 mt-6">
          {!recorder.recording && !recorder.audioUrl && (
            <Button icon={Mic} disabled={mic.status !== 'granted'} onClick={startRecording}>Start recording</Button>
          )}
          {recorder.recording && (
            <Button variant="coral" icon={Square} onClick={stopRecording}>Stop</Button>
          )}
          {recorder.audioUrl && !recorder.recording && (
            <>
              <Button variant="outline" icon={RotateCcw} onClick={reRecord}>Re-record</Button>
              <audio controls src={recorder.audioUrl} className="h-9" />
            </>
          )}
        </div>
      </Card>

      {speech.transcript && (
        <Card className="mt-5">
          <p className="field-label">Live transcript</p>
          <p className="text-sm text-text-secondary">{speech.transcript}</p>
        </Card>
      )}

      <div className="flex justify-between mt-5">
        <Button variant="ghost" disabled={current === 0} onClick={() => { setCurrent((c) => c - 1); reRecord() }}>Previous</Button>
        <Button onClick={nextOrSubmit}>{current < questions.length - 1 ? 'Submit answer & next' : 'Submit interview'}</Button>
      </div>

      <ConfirmDialog open={exitOpen} onClose={() => setExitOpen(false)} onConfirm={() => navigate('/app/interviews')} title="Exit interview?" message="Your progress on this session will be lost." confirmLabel="Exit" />
    </div>
  )
}
