import React from 'react'
import { m } from 'framer-motion'

export function DataTable({ columns, data, className = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-wider text-xs">
        No records available
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto gaming-scroll rounded-xl border border-slate-800/40 bg-slate-950/20">
      <table className={`w-full border-collapse text-sm text-left ${className}`}>
        <thead className="bg-[#0b0f19]/80 text-[10px] uppercase font-bold tracking-widest text-slate-400 border-b border-slate-800/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-5 py-4 font-extrabold ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {data.map((row, rowIndex) => (
            <m.tr
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.2, rowIndex * 0.02) }}
              key={rowIndex}
              className="hover:bg-slate-900/40 transition-colors duration-200"
            >
              {columns.map((col) => (
                <td 
                  key={col.key} 
                  className={`px-5 py-3.5 font-medium text-slate-300 ${
                    col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.render
                    ? col.render(row[col.key], row, rowIndex)
                    : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
