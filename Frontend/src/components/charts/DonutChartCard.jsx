import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import ChartCard from '../common/ChartCard'

const PALETTE = ['#B6FF3B', '#D3FF73', '#89CC16', '#6D9E1B']

export default function DonutChartCard({ title, subtitle, data, height = 240 }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#151D2E', border: '1px solid #273149', borderRadius: 10, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8792AA' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
