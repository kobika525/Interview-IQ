import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, RotateCcw, Share2, Mic } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import CircularProgress from '../../components/common/CircularProgress'
import ReportScoreCard from '../../components/reports/ReportScoreCard'
import RadarChartCard from '../../components/charts/RadarChartCard'
import LineChartCard from '../../components/charts/LineChartCard'
import QuestionBreakdownCard from '../../components/reports/QuestionBreakdownCard'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as reportService from '../../services/reportService'
import * as progressService from '../../services/progressService'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [trend, setTrend] = useState([])
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    reportService.getReport(id)
      .then(setReport)
      .catch((requestError) => {
        setError(requestError.message)
        toast.error(requestError.message)
      })
    progressService.getProgressOverview()
      .then((progress) => setTrend(progress.trend || []))
      .catch(() => setTrend([]))
  }, [id])

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      await reportService.downloadInterviewReport(report.id)
      toast.success('PDF downloaded successfully.')
    } catch (downloadError) {
      toast.error(downloadError.message || 'Unable to download the PDF report.')
    } finally {
      setDownloading(false)
    }
  }

  if (error) return <Card className="text-center py-12 text-error">{error}</Card>
  if (!report) return <SkeletonLoader rows={5} />

  const scores = [
    { label: 'Communication', value: report.communication },
    { label: 'Technical skills', value: report.technical },
    { label: 'Grammar', value: report.grammar },
    { label: 'Confidence', value: report.confidenceScore },
    { label: 'Voice quality', value: report.voiceQuality },
    { label: 'Visual presentation', value: report.visualMetrics?.visualPresentationScore },
    { label: 'Camera engagement', value: report.visualMetrics?.eyeContactPercentage },
    { label: 'Relevance', value: report.relevance },
    { label: 'Structure', value: report.structure },
    { label: 'Problem solving', value: report.completeness },
    { label: 'Face visibility', value: report.faceVisibility },
    { label: 'Camera facing', value: report.cameraFacing },
  ]

  const voiceMetrics = [
    ['Recording duration', report.recordingDurationSeconds != null ? `${report.recordingDurationSeconds}s` : null],
    ['Words per minute', report.speakingWpm],
    ['Speaking speed', report.speakingSpeed?.replaceAll('_', ' ')],
    ['Average pause', report.averagePauseSeconds != null ? `${report.averagePauseSeconds}s` : null],
    ['Longest pause', report.longestPauseSeconds != null ? `${report.longestPauseSeconds}s` : null],
    ['Long pauses', report.longPauseCount],
    ['Filler words', report.fillerWords],
    ['Voice confidence', report.voiceConfidence != null ? `${report.voiceConfidence}/100` : null],
    ['Voice fluency', report.voiceFluency != null ? `${report.voiceFluency}/100` : null],
    ['Pronunciation quality', report.pronunciationQuality != null ? `${report.pronunciationQuality}/100` : null],
    ['Voice clarity', report.speechClarity != null ? `${report.speechClarity}/100` : null],
  ].filter(([, value]) => value != null)

  const videoMetrics = [
    ['Face Presence', report.visualMetrics?.facePresencePercentage, '%'],
    ['Camera Engagement (approx.)', report.visualMetrics?.eyeContactPercentage, '%'],
    ['Head Stability', report.visualMetrics?.headStabilityScore, '/100'],
    ['Lighting Quality', report.visualMetrics?.lightingStatus?.replaceAll('_', ' '), ''],
    ['Camera Framing', report.visualMetrics?.cameraFramingScore, '/100'],
    ['Multiple-Face Warning', report.visualMetrics ? (report.visualMetrics.multipleFaceWarning ? 'Warning' : 'No warning') : null, ''],
    ['Visual Presentation Score', report.visualMetrics?.visualPresentationScore, '/100'],
  ]

  return (
    <div>
      <PageHeader
        title="Interview Report"
        subtitle={`${report.role} · ${report.type} · ${report.mode} · ${report.difficulty} · ${formatDate(report.date)} · ${report.duration}`}
        actions={
          <>
            <Button
              variant="outline"
              icon={Download}
              loading={downloading}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
            <Button variant="ghost" icon={Share2}>Share</Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card className="flex flex-col items-center justify-center text-center">
          <CircularProgress value={report.overall} size={130} strokeWidth={11} label="overall" />
          <div className="flex gap-2 mt-4">
            <Link to={`/app/interviews/setup`}><Button variant="outline" icon={RotateCcw} className="!text-xs !py-2">Retake</Button></Link>
            <Link to={`/app/interviews/setup`}><Button icon={Mic} className="!text-xs !py-2">Improvement interview</Button></Link>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <p className="field-label mb-3">Score breakdown</p>
          <ReportScoreCard scores={scores} />
        </Card>
      </div>

      {voiceMetrics.length > 0 && (
        <Card className="mb-5">
          <p className="field-label mb-3">Voice delivery metrics</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {voiceMetrics.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-semibold text-text-primary mt-1 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {report.visualMetrics && (
        <Card className="mb-5">
          <p className="field-label mb-1">Video presentation metrics</p>
          <p className="text-xs text-text-muted mb-3">
            Observable camera and framing estimates only; these do not infer emotion, honesty, or personality.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {videoMetrics.map(([label, value, suffix]) => (
              <div key={label} className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-semibold text-text-primary mt-1 capitalize">{value == null ? 'Unavailable' : `${value}${typeof value === 'number' ? suffix : ''}`}</p>
              </div>
            ))}
          </div>
          {report.visualMetrics?.cameraFramingGuidance?.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-text-secondary">
              {report.visualMetrics.cameraFramingGuidance.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          )}
          {report.visualMetrics?.lightingRecommendation && <p className="mt-3 text-sm text-text-secondary">{report.visualMetrics.lightingRecommendation}</p>}
          <p className="mt-4 text-xs text-text-muted">{report.visualMetrics?.visualPresentationDisclaimer}</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <RadarChartCard title="Performance radar" data={[
          { skill: 'Technical', value: report.technical },
          { skill: 'Communication', value: report.communication },
          { skill: 'Relevance', value: report.relevance },
          { skill: 'Structure', value: report.grammar },
          { skill: 'Problem solving', value: report.completeness },
        ]} />
        <LineChartCard title="Performance trend" subtitle="Overall score across recent sessions" data={trend} lines={['overall']} />
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Card>
          <p className="text-xs font-semibold text-success mb-2">STRENGTHS</p>
          <ul className="space-y-1.5">{report.strengths.map((s) => <li key={s} className="text-sm text-text-secondary">• {s}</li>)}</ul>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-error mb-2">WEAKNESSES</p>
          <ul className="space-y-1.5">{report.weaknesses.map((s) => <li key={s} className="text-sm text-text-secondary">• {s}</li>)}</ul>
        </Card>
      </div>

      {report.improvedAnswers.length > 0 && (
        <Card className="mb-5">
          <p className="text-xs font-semibold text-text-muted mb-2">IMPROVED ANSWERS</p>
          <ol className="space-y-2 list-decimal list-inside">
            {report.improvedAnswers.map((answer, index) => (
              <li key={`${index}-${answer}`} className="text-sm text-text-secondary">{answer}</li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="mb-5">
        <p className="text-xs font-semibold text-text-muted mb-2">IMPROVEMENT SUGGESTIONS</p>
        <ul className="space-y-2">{report.suggestions.map((s) => <li key={s} className="text-sm text-text-secondary flex gap-2"><Badge tone="blue">Tip</Badge>{s}</li>)}</ul>
      </Card>

      {(report.careerAdvice.length > 0 || report.learningResources.length > 0) && (
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <Card>
            <p className="text-xs font-semibold text-text-muted mb-2">CAREER ADVICE</p>
            <ul className="space-y-1.5">{report.careerAdvice.map((item) => <li key={item} className="text-sm text-text-secondary">• {item}</li>)}</ul>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-text-muted mb-2">LEARNING RESOURCES</p>
            <ul className="space-y-1.5">{report.learningResources.map((item) => <li key={item} className="text-sm text-text-secondary">• {item}</li>)}</ul>
          </Card>
        </div>
      )}

      {report.hiringRecommendation && (
        <Card className="mb-5 border-blue/20 bg-blue/5">
          <p className="text-xs font-semibold text-blue mb-2">MOCK INTERVIEW READINESS</p>
          <p className="text-sm text-text-secondary">{report.hiringRecommendation}</p>
        </Card>
      )}

      <h3 className="font-display font-semibold text-text-primary mb-3">Question-by-question analysis</h3>
      <div className="space-y-3">
        {report.questionBreakdown.map((q, i) => <QuestionBreakdownCard key={i} item={q} index={i} />)}
      </div>
    </div>
  )
}
