import { EmptyState } from '../../components'

export function ClientesPage() {
  return (
    <div className="space-y-6">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">Clientes</h1>
        </div>
      </header>
      <EmptyState title="Clientes" description="En construcción" />
    </div>
  )
}
