export type Rol = 'ADMIN' | 'CLIENTE'
export type EstadoCliente = 'ACTIVO' | 'BAJA'
export type EstadoCuenta = 'ACTIVA' | 'CERRADA'
export type TipoMovimiento = 'CREDITO' | 'DEBITO'
export type OrigenMovimiento =
  | 'DEPOSITO'
  | 'RETIRO'
  | 'PAGO_SERVICIO'
  | 'TRANSFERENCIA'
  | 'DESEMBOLSO'
  | 'REVERSION'
export type EstadoPago = 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO' | 'REVERTIDO'
export type TipoTransferencia = 'PROPIA' | 'TERCERO' | 'INTERBANCARIA'
export type EstadoTransferencia = 'COMPLETADA' | 'RECHAZADA' | 'REVERTIDA'
export type EstadoPrestamo = 'SOLICITADO' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO'

export interface UsuarioSesion {
  id: string
  email: string
  rol: Rol
  nombreCompleto?: string
}

export interface LoginResponse {
  token: string
  usuario: UsuarioSesion
}

export interface ApiErrorPayload {
  code: string
  message: string
  details: unknown | null
}
