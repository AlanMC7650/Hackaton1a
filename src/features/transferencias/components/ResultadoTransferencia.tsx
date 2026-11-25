import { Button } from '../../../components'
import { formatCurrency } from '../../../utils/formatters'
import type { Transferencia } from '../types'

interface ResultadoTransferenciaProps {
  transferencia: Transferencia
  onCerrar: () => void
}

const CONFIG = {
  COMPLETADA: { clase: 'glass-alert-success', titulo: 'Transferencia completada' },
  RECHAZADA: { clase: 'glass-alert-danger', titulo: 'Transferencia rechazada' },
  REVERTIDA: { clase: 'glass-alert-warning', titulo: 'Transferencia revertida' },
} as const

export function ResultadoTransferencia({ transferencia, onCerrar }: ResultadoTransferenciaProps) {
  const { clase, titulo } = CONFIG[transferencia.estado]

  return (
    <div className={clase} role="status">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <strong>{titulo}</strong>
        <p>
          {formatCurrency(transferencia.monto)} hacia {transferencia.cuentaDestinoNumero}
          {transferencia.titularDestino ? ` (${transferencia.titularDestino})` : ''}.
        </p>
        {transferencia.estado === 'COMPLETADA' && transferencia.codigoExterno && (
          <p>
            Código del intermediario: <span className="font-mono">{transferencia.codigoExterno}</span>
          </p>
        )}
        {transferencia.estado === 'COMPLETADA' && !transferencia.codigoExterno && (
          <p>El dinero ya fue acreditado en la cuenta de destino.</p>
        )}
        {transferencia.estado === 'REVERTIDA' && (
          <p>
            {transferencia.motivo ?? 'La operación no pudo completarse.'} El dinero fue devuelto a tu
            cuenta de origen.
          </p>
        )}
        {transferencia.estado === 'RECHAZADA' && (
          <p>{transferencia.motivo ?? 'La operación fue rechazada.'} No se movió dinero.</p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onCerrar}>
        Cerrar
      </Button>
    </div>
  )
}
