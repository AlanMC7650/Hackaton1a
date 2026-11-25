import { useEffect, useState } from 'react'
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components'
import { formatCurrency, formatDateTime } from '../../../utils/formatters'
import { cuentasApi, mensajeError, type Movimiento } from '../cuentas.api'

const origenLabels: Record<Movimiento['origen'], string> = {
  DEPOSITO: 'Depósito',
  RETIRO: 'Retiro',
  PAGO_SERVICIO: 'Pago de servicio',
  TRANSFERENCIA: 'Transferencia',
  DESEMBOLSO: 'Desembolso',
  REVERSION: 'Reversión',
}

export function ExtractoCuenta({ id }: { id: string }) {
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    cuentasApi
      .movimientos(id, controller.signal)
      .then(setMovimientos)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(mensajeError(cause))
      })
    return () => controller.abort()
  }, [id])

  if (error)
    return (
      <p role="alert" className="form-error-ds">
        {error}
      </p>
    )
  if (!movimientos) return <p role="status">Cargando movimientos…</p>
  if (!movimientos.length) return <EmptyState title="Aún no hay movimientos" />

  return (
    <Table aria-label="Movimientos de la cuenta">
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fecha</TableHead>
          <TableHead scope="col">Operación</TableHead>
          <TableHead scope="col">Monto</TableHead>
          <TableHead scope="col">Saldo resultante</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map((movimiento) => (
          <TableRow key={movimiento.id}>
            <TableCell>{formatDateTime(movimiento.createdAt)}</TableCell>
            <TableCell>
              {origenLabels[movimiento.origen]}
              {movimiento.glosa && (
                <small className="cuentas-movimiento-glosa">{movimiento.glosa}</small>
              )}
            </TableCell>
            <TableCell>
              {movimiento.tipo === 'CREDITO' ? '+' : '−'}
              {formatCurrency(movimiento.monto)}
            </TableCell>
            <TableCell>{formatCurrency(movimiento.saldoResultante)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
