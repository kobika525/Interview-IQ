import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import ChartCard from '../common/ChartCard'

const COLORS = { overall: '#1EA7FF', technical: '#00D5FF', communication: '#FF4964' }

export default function LineChartCard({ title, subtitle, data, lines, height = 260 }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#202A3D" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#8792AA', fontSize: 11 }} axisLine={{ stroke: '#273149' }} tickLine={false} />
          <YAxis tick={{ fill: '#8792AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#151D2E', border: '1px solid #273149', borderRadius: 10, fontSize: 12 }} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#8792AA' }} />}
          {lines.map((key) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[key] || '#1EA7FF'} strokeWidth={2.5} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
