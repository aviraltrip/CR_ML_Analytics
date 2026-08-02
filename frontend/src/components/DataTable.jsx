import React from 'react'

/**
 * Reusable data table with responsive wrapper.
 */
export function DataTable({ columns, data, className = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-dark-400">
        No data available
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className={`w-full text-sm text-left ${className}`}>
        <thead className="text-xs uppercase text-dark-400 border-b border-dark-200/20">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 font-semibold"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-dark-200/10 hover:bg-dark-50/5 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render
                    ? col.render(row[col.key], row, rowIndex)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
