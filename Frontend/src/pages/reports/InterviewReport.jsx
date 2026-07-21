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
import { formatDate } from '../../utils/formatters'
import { PROGRESS_TREND } from '../../data/mockData'

export default function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)

  useEffect(() => { reportService.getReport(id).then(setReport) }, [id])

  if (!report) return <SkeletonLoader rows={5} />

  const scores = [
    { label: 'Communication', value: report.communication },
    { label: 'Relevance', value: report.relevance },
    { label: 'Keywords', value: report.keywordCoverage },
    { label: 'Grammar', value: report.grammar },
    { label: 'Completeness', value: report.completeness },
    { label: 'Speaking speed', value: report.speakingSpeed },
    { label: 'Filler words', value: report.fillerWords },
    { label: 'Speech clarity', value: report.speechClarity },
    { label: 'Face visibility', value: report.faceVisibility },
    { label: 'Camera facing', value: report.cameraFacing },
  ]

  return (
    <div>
      <PageHeader
        title="Interview Report"
        subtitle={`${report.role} · ${report.type} · ${report.mode} · ${report.difficulty} · ${formatDate(report.date)} · ${report.duration}`}
        actions={
          <>
            <Button variant="outline" icon={Download}>Download PDF</Button>
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

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <RadarChartCard title="Performance radar" data={[
          { skill: 'Technical', value: report.technical },
          { skill: 'Communication', value: report.communication },
          { skill: 'Relevance', value: report.relevance },
          { skill: 'Grammar', value: report.grammar },
          { skill: 'Completeness', value: report.completeness },
        ]} />
        <LineChartCard title="Performance trend" subtitle="Overall score across recent sessions" data={PROGRESS_TREND} lines={['overall']} />
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

      <Card className="mb-5">
        <p className="text-xs font-semibold text-text-muted mb-2">IMPROVEMENT SUGGESTIONS</p>
        <ul className="space-y-2">{report.suggestions.map((s) => <li key={s} className="text-sm text-text-secondary flex gap-2"><Badge tone="blue">Tip</Badge>{s}</li>)}</ul>
      </Card>

      <h3 className="font-display font-semibold text-text-primary mb-3">Question-by-question analysis</h3>
      <div className="space-y-3">
        {report.questionBreakdown.map((q, i) => <QuestionBreakdownCard key={i} item={q} index={i} />)}
      </div>
    </div>
  )
}
