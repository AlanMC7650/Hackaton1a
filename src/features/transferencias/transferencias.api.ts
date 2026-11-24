import { ApiService } from '../../services/api'
import type { Banco, CuentaResumen, NuevaTransferencia, Transferencia } from './types'

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

/** POST /api/transferencias */
export function crearTransferencia(cuerpo: NuevaTransferencia): Promise<Transferencia> {
  return ApiService.post<Transferencia>('/api/transferencias', cuerpo)
}

/** GET /api/transferencias: historial del cliente (el ADMIN ve todas). */
export function listarTransferencias(): Promise<Transferencia[]> {
  return ApiService.get<Transferencia[]>('/api/transferencias')
}

/** GET /api/transferencias/bancos: lista que entrega el intermediario interbancario. */
export function listarBancos(): Promise<Banco[]> {
  return ApiService.get<Banco[]>('/api/transferencias/bancos')
}

/** GET /api/cuentas: cuentas activas del cliente, para elegir origen y destino propio. */
export async function listarCuentasActivas(): Promise<CuentaResumen[]> {
  const data = await ApiService.get<unknown>('/api/cuentas')
  const lista = Array.isArray(data)
    ? data
    : esRegistro(data)
      ? ((data.items ?? data.data ?? data.cuentas ?? []) as unknown[])
      : []

  return lista
    .filter(esRegistro)
    .map((c) => ({
      id: String(c.id),
      numero: String(c.numero),
      alias: typeof c.alias === 'string' && c.alias ? c.alias : null,
      saldo: Number(c.saldo ?? 0),
      estado: (c.estado === 'CERRADA' ? 'CERRADA' : 'ACTIVA') as CuentaResumen['estado'],
    }))
    .filter((c) => c.estado === 'ACTIVA')
}
