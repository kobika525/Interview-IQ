import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import ChartCard from '../common/ChartCard'

export default function BarChartCard({ title, subtitle, data, dataKey = 'value', nameKey = 'name', height = 260, color = '#1EA7FF' }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#202A3D" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={nameKey} tick={{ fill: '#8792AA', fontSize: 11 }} axisLine={{ stroke: '#273149' }} tickLine={false} />
          <YAxis tick={{ fill: '#8792AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#151D2E', border: '1px solid #273149', borderRadius: 10, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
