import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import ChartCard from '../common/ChartCard'

export default function BarChartCard({ title, subtitle, data, dataKey = 'value', nameKey = 'name', height = 260, color = '#B6FF3B' }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#20241F" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={nameKey} tick={{ fill: '#899184', fontSize: 11 }} axisLine={{ stroke: '#2B3028' }} tickLine={false} />
          <YAxis tick={{ fill: '#899184', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#151815', border: '1px solid #2B3028', borderRadius: 10, fontSize: 12 }} cursor={{ fill: 'rgba(182,255,59,0.04)' }} />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
