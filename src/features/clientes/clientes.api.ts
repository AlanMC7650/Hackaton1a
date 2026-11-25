import { ApiService } from '../../services/api'
import type { EstadoCliente, Rol } from '../../types'

export interface ClienteItem {
  id: string
  ci: string
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  direccion: string | null
  rol: Rol
  estado: EstadoCliente
  createdAt: string
}

export interface CrearClienteInput {
  ci: string
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  direccion?: string
  password: string
  rol?: Rol
}

export interface ActualizarClienteInput {
  email?: string
  telefono?: string | null
  direccion?: string | null
}

export const clientesApi = {
  listar(q?: string): Promise<ClienteItem[]> {
    const suffix = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
    return ApiService.get<ClienteItem[]>(`/api/clientes${suffix}`)
  },

  crear(input: CrearClienteInput): Promise<ClienteItem> {
    return ApiService.post<ClienteItem>('/api/clientes', input)
  },

  actualizar(id: string, input: ActualizarClienteInput): Promise<ClienteItem> {
    return ApiService.patch<ClienteItem>(`/api/clientes/${id}`, input)
  },

  darDeBaja(id: string): Promise<ClienteItem> {
    return ApiService.delete<ClienteItem>(`/api/clientes/${id}`)
  },
}
