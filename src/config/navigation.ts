import type { ElementType } from 'react'
import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react'
import type { Rol } from '../types'

export interface NavItemConfig {
  id: string
  path: string
  icon: ElementType
  getLabel: (rol: Rol) => string
  allowedRoles: Rol[]
  description: string
}

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  {
    id: 'inicio',
    path: '/',
    icon: LayoutDashboard,
    getLabel: () => 'Inicio',
    allowedRoles: ['ADMIN', 'CLIENTE'],
    description: 'Resumen general de tu banca por internet y accesos rápidos.',
  },
  {
    id: 'clientes',
    path: '/clientes',
    icon: Users,
    getLabel: () => 'Clientes',
    allowedRoles: ['ADMIN'],
    description: 'Alta, consulta, modificación y baja lógica de clientes.',
  },
  {
    id: 'cuentas',
    path: '/cuentas',
    icon: Wallet,
    getLabel: (rol) => (rol === 'CLIENTE' ? 'Mis Cuentas' : 'Cuentas'),
    allowedRoles: ['ADMIN', 'CLIENTE'],
    description: 'Apertura, depósitos, retiros y extracto de movimientos.',
  },
  {
    id: 'pagos',
    path: '/pagos',
    icon: Receipt,
    getLabel: () => 'Pagos de Servicios',
    allowedRoles: ['ADMIN', 'CLIENTE'],
    description: 'Consulta de deuda y pago de luz, agua, teléfono y gas.',
  },
  {
    id: 'transferencias',
    path: '/transferencias',
    icon: ArrowLeftRight,
    getLabel: () => 'Transferencias',
    allowedRoles: ['ADMIN', 'CLIENTE'],
    description: 'Transferencias propias, a terceros y a otros bancos.',
  },
  {
    id: 'prestamos',
    path: '/prestamos',
    icon: Landmark,
    getLabel: (rol) => (rol === 'CLIENTE' ? 'Mis Préstamos' : 'Préstamos'),
    allowedRoles: ['ADMIN', 'CLIENTE'],
    description: 'Simulación, solicitud, aprobación y plan de cuotas.',
  },
]

export function getNavItemsForRole(rol: Rol): NavItemConfig[] {
  return NAVIGATION_ITEMS.filter((item) => item.allowedRoles.includes(rol))
}
