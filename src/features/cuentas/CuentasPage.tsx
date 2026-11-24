import { EmptyState } from '../../components'

export function CuentasPage() {
  return (
    <div className="space-y-6">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">Cuentas de Ahorro</h1>
        </div>
      </header>
      <EmptyState title="Cuentas de Ahorro" description="En construcción" />
    </div>
  )
}
