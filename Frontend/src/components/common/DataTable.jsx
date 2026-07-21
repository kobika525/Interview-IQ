export default function DataTable({ columns, data, renderMobileCard, emptyMessage = 'No records found.' }) {
  if (!data.length) {
    return <div className="text-center text-sm text-text-muted py-10">{emptyMessage}</div>
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto surface-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              {columns.map((col) => (
                <th key={col.key} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3.5">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-border-subtle last:border-0 hover:bg-black/[0.025] transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-text-secondary">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, i) => (
          <div key={row.id ?? i}>{renderMobileCard ? renderMobileCard(row) : null}</div>
        ))}
      </div>
    </>
  )
}
