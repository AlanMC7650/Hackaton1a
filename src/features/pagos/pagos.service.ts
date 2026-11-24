import { ApiService } from '../../services/api'
import type {
  CrearPagoPayload,
  CuentaResumen,
  DeudaServicio,
  EmpresaServicio,
  PagoRegistro,
} from './pagos.types'

export const pagosApi = {
  listarEmpresas(): Promise<EmpresaServicio[]> {
    return ApiService.get<EmpresaServicio[]>('/api/pagos/empresas')
  },

  consultarDeuda(empresaCodigo: string, codigoCliente: string): Promise<DeudaServicio> {
    const params = new URLSearchParams({
      empresa: empresaCodigo,
      codigo: codigoCliente,
    })
    return ApiService.get<DeudaServicio>(`/api/pagos/deuda?${params.toString()}`)
  },

  listarCuentas(): Promise<CuentaResumen[]> {
    return ApiService.get<CuentaResumen[]>('/api/cuentas')
  },

  pagar(payload: CrearPagoPayload): Promise<PagoRegistro> {
    return ApiService.post<PagoRegistro>('/api/pagos', payload)
  },

  listarPagos(): Promise<PagoRegistro[]> {
    return ApiService.get<PagoRegistro[]>('/api/pagos')
  },
}
