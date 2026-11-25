import { ApiService } from '../../services/api'
import type { EstadoPrestamo } from '../../types'

export interface CuotaPlan {
  numero: number
  fechaVencimiento: string
  capital: number
  interes: number
  cuota: number
  saldo: number
}

export interface Simulacion {
  cuotaMensual: number
  totalInteres: number
  totalPagar: number
  cuotas: CuotaPlan[]
}

export interface Prestamo {
  id: string
  clienteId: string
  cuentaDesembolsoId: string
  cuentaDesembolsoNumero: string
  monto: number
  tasaAnual: number
  plazoMeses: number
  cuotaMensual: number
  estado: EstadoPrestamo
  referenciaDesembolso: string | null
  createdAt: string
  cuotas?: CuotaPlan[]
}

export interface CuentaOpcion {
  id: string
  numero: string
  alias?: string | null
  saldo?: number
  estado?: string
  clienteId?: string
}

export interface SolicitudPrestamo {
  cuentaDesembolsoId: string
  monto: number
  plazoMeses: number
  tasaAnual: number
}

const BASE = '/api/prestamos'

export const prestamosApi = {
  simular: (datos: Omit<SolicitudPrestamo, 'cuentaDesembolsoId'>) =>
    ApiService.post<Simulacion>(`${BASE}/simular`, datos),
  listar: () => ApiService.get<Prestamo[]>(BASE),
  obtener: (id: string) => ApiService.get<Prestamo>(`${BASE}/${id}`),
  crear: (datos: SolicitudPrestamo) => ApiService.post<Prestamo>(BASE, datos),
  aprobar: (id: string) => ApiService.post<Prestamo>(`${BASE}/${id}/aprobar`),
  rechazar: (id: string) => ApiService.post<Prestamo>(`${BASE}/${id}/rechazar`),
  cancelar: (id: string) => ApiService.delete<Prestamo>(`${BASE}/${id}`),

  /** Cuentas activas para elegir la cuenta de desembolso (módulo de I3). */
  async cuentasActivas(): Promise<CuentaOpcion[]> {
    const respuesta = await ApiService.get<CuentaOpcion[] | { data?: CuentaOpcion[]; items?: CuentaOpcion[] }>(
      '/api/cuentas',
    )
    const lista = Array.isArray(respuesta) ? respuesta : (respuesta.data ?? respuesta.items ?? [])
    return lista.filter((cuenta) => !cuenta.estado || cuenta.estado === 'ACTIVA')
  },
}
