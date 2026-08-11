import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import ChartCard from '../common/ChartCard'

export default function RadarChartCard({ title, subtitle, data, dataKey = 'value', nameKey = 'skill', height = 280 }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke="#273149" />
          <PolarAngleAxis dataKey={nameKey} tick={{ fill: '#8792AA', fontSize: 11 }} />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
          <Radar dataKey={dataKey} stroke="#D3FF73" fill="#B6FF3B" fillOpacity={0.22} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
