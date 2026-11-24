import { EmptyState } from '../../components'

export function PrestamosPage() {
  return (
    <div className="space-y-6">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">Préstamos</h1>
        </div>
      </header>
      <EmptyState title="Préstamos" description="En construcción" />
    </div>
  )
}
