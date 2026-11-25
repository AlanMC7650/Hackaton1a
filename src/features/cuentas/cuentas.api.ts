import { ApiError, ApiService } from '../../services/api'
import type { EstadoCuenta, OrigenMovimiento, TipoMovimiento } from '../../types'

export interface Cuenta {
  id: string
  numero: string
  clienteId: string
  alias: string | null
  saldo: number
  estado: EstadoCuenta
}

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  origen: OrigenMovimiento
  monto: number
  saldoResultante: number
  glosa: string
  createdAt: string
}

const path = '/api/cuentas'

export const cuentasApi = {
  listar: (clienteId: string, signal: AbortSignal) =>
    ApiService.get<Cuenta[]>(clienteId ? `${path}?${new URLSearchParams({ clienteId })}` : path, {
      signal,
    }),
  abrir: (alias: string, clienteId?: string) => ApiService.post<Cuenta>(path, { alias, clienteId }),
  editar: (id: string, alias: string) => ApiService.patch<Cuenta>(`${path}/${id}`, { alias }),
  cerrar: (id: string) => ApiService.delete<void>(`${path}/${id}`),
  mover: (
    id: string,
    operacion: 'depositos' | 'retiros',
    monto: number,
    glosa: string,
    referencia: string,
  ) =>
    ApiService.post<Movimiento>(
      `${path}/${id}/${operacion}`,
      { monto, glosa: glosa || undefined },
      {
        headers: { 'Idempotency-Key': referencia },
      },
    ),
  movimientos: (id: string, signal: AbortSignal) =>
    ApiService.get<Movimiento[]>(`${path}/${id}/movimientos`, { signal }),
}

export function mensajeError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'No se pudo conectar con el servicio de cuentas.'
}
