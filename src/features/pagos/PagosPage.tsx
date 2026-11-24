import { EmptyState } from '../../components'

export function PagosPage() {
  return (
    <div className="space-y-6">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">Pagos de Servicios</h1>
        </div>
      </header>
      <EmptyState title="Pagos de Servicios" description="En construcción" />
    </div>
  )
}
