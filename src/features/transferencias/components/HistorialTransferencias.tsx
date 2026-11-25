import { ArrowLeftRight } from 'lucide-react'
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components'
import type { BadgeVariant } from '../../../components'
import { formatCurrency, formatDateTime } from '../../../utils/formatters'
import type { CuentaResumen, Transferencia } from '../types'

interface HistorialTransferenciasProps {
  transferencias: Transferencia[]
  cuentas: CuentaResumen[]
  cargando: boolean
  error: string | null
}

const ESTADO: Record<Transferencia['estado'], { label: string; variant: BadgeVariant }> = {
  COMPLETADA: { label: 'Completada', variant: 'success' },
  RECHAZADA: { label: 'Rechazada', variant: 'danger' },
  REVERTIDA: { label: 'Revertida', variant: 'warning' },
}

const TIPO: Record<Transferencia['tipo'], string> = {
  PROPIA: 'Propia',
  TERCERO: 'A tercero',
  INTERBANCARIA: 'Otro banco',
}

export function HistorialTransferencias({
  transferencias,
  cuentas,
  cargando,
  error,
}: HistorialTransferenciasProps) {
  if (error) return <p className="form-error-ds">{error}</p>
  if (cargando && transferencias.length === 0) return <p className="muted">Cargando historial…</p>
  if (transferencias.length === 0) {
    return (
      <EmptyState
        title="Aún no hay transferencias"
        description="Cuando envíes dinero, la operación aparecerá aquí."
        icon={<ArrowLeftRight size={42} className="text-muted" />}
      />
    )
  }

  const numeroOrigen = (id: string) => cuentas.find((c) => c.id === id)?.numero ?? `…${id.slice(0, 8)}`

  return (
    <Table aria-label="Historial de transferencias">
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead>Destino</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Detalle</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transferencias.map((t) => {
          const estado = ESTADO[t.estado]
          return (
            <TableRow key={t.id}>
              <TableCell>{formatDateTime(t.createdAt)}</TableCell>
              <TableCell>{TIPO[t.tipo]}</TableCell>
              <TableCell className="font-mono">{numeroOrigen(t.cuentaOrigenId)}</TableCell>
              <TableCell>
                <span className="font-mono">{t.cuentaDestinoNumero}</span>
                <br />
                <span className="text-xs text-muted">
                  {t.tipo === 'INTERBANCARIA'
                    ? `${t.bancoDestino} · ${t.titularDestino ?? ''}`
                    : 'Banco Chuno'}
                </span>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(t.monto)}</TableCell>
              <TableCell>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                {t.motivo ?? t.codigoExterno ?? t.glosa}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
