import type { ReactNode } from 'react'

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  const classes = ['badge-ds', `badge-${variant}`, `badge-${size}`, className]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}

/**
 * StatusBadge inteligente: mapea códigos de dominio de Chuno Banca a colores y etiquetas en español.
 */
interface StatusBadgeProps {
  status: string | null | undefined
  size?: BadgeSize
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  // Roles
  ADMIN: { label: 'Admin', variant: 'brand' },
  CLIENTE: { label: 'Cliente', variant: 'info' },

  // Clientes
  ACTIVO: { label: 'Activo', variant: 'success' },
  BAJA: { label: 'Baja', variant: 'danger' },

  // Cuentas
  ACTIVA: { label: 'Activa', variant: 'success' },
  CERRADA: { label: 'Cerrada', variant: 'neutral' },

  // Movimientos
  CREDITO: { label: 'Crédito', variant: 'success' },
  DEBITO: { label: 'Débito', variant: 'warning' },

  // Pagos
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  COMPLETADO: { label: 'Completado', variant: 'success' },
  RECHAZADO: { label: 'Rechazado', variant: 'danger' },
  REVERTIDO: { label: 'Revertido', variant: 'warning' },

  // Transferencias
  PROPIA: { label: 'Propia', variant: 'info' },
  TERCERO: { label: 'Tercero', variant: 'brand' },
  INTERBANCARIA: { label: 'Interbancaria', variant: 'neutral' },
  COMPLETADA: { label: 'Completada', variant: 'success' },
  RECHAZADA: { label: 'Rechazada', variant: 'danger' },
  REVERTIDA: { label: 'Revertida', variant: 'warning' },

  // Préstamos
  SOLICITADO: { label: 'Solicitado', variant: 'warning' },
  APROBADO: { label: 'Aprobado', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'neutral' },
}

export function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  if (!status) return null

  const config = STATUS_CONFIG[status.toUpperCase()] ?? {
    label: status,
    variant: 'neutral' as BadgeVariant,
  }

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  )
}
