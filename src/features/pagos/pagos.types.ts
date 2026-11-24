import type { EstadoCuenta, EstadoPago } from '../../types'

export interface EmpresaServicio {
  id: string
  codigo: string
  nombre: string
  tipo: 'LUZ' | 'AGUA' | 'TELEFONO' | 'GAS' | 'OTRO'
  activo: boolean
}

export interface DeudaServicio {
  empresa: {
    id: string
    codigo: string
    nombre: string
    tipo: string
  }
  codigoCliente: string
  titular: string
  periodo: string
  monto: number
}

export interface CuentaResumen {
  id: string
  numero: string
  clienteId: string
  alias: string | null
  moneda: string
  saldo: number
  estado: EstadoCuenta
}

export interface PagoRegistro {
  id: string
  referencia: string
  clienteId: string
  cuentaId: string
  empresaId: string
  empresa?: EmpresaServicio
  codigoClienteServicio: string
  periodo: string
  monto: number
  estado: EstadoPago
  comprobante: string | null
  motivo: string | null
  createdAt: string
  updatedAt: string
}

export interface CrearPagoPayload {
  cuentaId: string
  empresaCodigo: string
  codigoClienteServicio: string
}
