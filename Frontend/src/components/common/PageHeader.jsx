import Breadcrumb from './Breadcrumb'

export default function PageHeader({ title, subtitle, breadcrumb, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
      <div>
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  )
}
