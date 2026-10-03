import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

export function CardPerformanceChart({ chartData, height = 380 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <XAxis
          type="number"
          stroke="#64748b"
          fontSize={10}
          tickLine={false}
          tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#64748b"
          fontSize={9}
          tickLine={false}
          width={110}
          interval={0}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0c1220',
            borderColor: '#1e293b',
            borderRadius: '12px',
          }}
          itemStyle={{ color: '#fff' }}
          labelStyle={{ color: '#818cf8', fontWeight: 'bold' }}
          formatter={(value) => [`${value}%`, 'Win Rate Margin']}
        />
        <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
        <Bar dataKey="winRateDiff" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => {
            let barColor = '#64748b'
            if (entry.status === 'Underrated') barColor = '#10b981'
            else if (entry.status === 'Strong/Meta') barColor = '#3b82f6'
            else if (entry.status === 'Overrated') barColor = '#ef4444'
            return <Cell key={`cell-${entry.name || index}`} fill={barColor} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default CardPerformanceChart
