import type { EstadoCuenta, EstadoTransferencia, TipoTransferencia } from '../../types'

export interface Transferencia {
  id: string
  referencia: string
  clienteId: string
  tipo: TipoTransferencia
  cuentaOrigenId: string
  cuentaDestinoId: string | null
  cuentaDestinoNumero: string
  bancoDestino: string
  titularDestino: string | null
  monto: number
  glosa: string
  estado: EstadoTransferencia
  codigoExterno: string | null
  motivo: string | null
  createdAt: string
}

export interface Banco {
  codigo: string
  nombre: string
}

/** Lo mínimo que este módulo necesita de una cuenta (la API de ms-cuentas es de otro módulo). */
export interface CuentaResumen {
  id: string
  numero: string
  alias: string | null
  saldo: number
  estado: EstadoCuenta
}

interface CuerpoComun {
  cuentaOrigenId: string
  monto: number
  glosa?: string
  /** Uuid generado en el cliente: un reintento con la misma referencia no mueve el dinero dos veces. */
  referencia: string
}

export type NuevaTransferencia =
  | (CuerpoComun & { tipo: 'PROPIA' | 'TERCERO'; cuentaDestinoNumero: string })
  | (CuerpoComun & {
      tipo: 'INTERBANCARIA'
      bancoDestino: string
      cuentaDestinoNumero: string
      titularDestino: string
    })

export const MONTO_MAXIMO = 50_000
