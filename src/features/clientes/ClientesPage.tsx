import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Edit2, Plus, Search, UserX } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../../components'
import { ApiError } from '../../services/api'
import type { Rol } from '../../types'
import { clientesApi, type ClienteItem } from './clientes.api'

const INITIAL_FORM = {
  ci: '',
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: '',
  password: '',
  rol: 'CLIENTE' as Rol,
}

export function ClientesPage() {
  const toast = useToast()

  const [clientes, setClientes] = useState<ClienteItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [modalCrear, setModalCrear] = useState(false)
  const [formCrear, setFormCrear] = useState(INITIAL_FORM)
  const [guardandoCrear, setGuardandoCrear] = useState(false)

  const [clienteEditar, setClienteEditar] = useState<ClienteItem | null>(null)
  const [formEditar, setFormEditar] = useState({ email: '', telefono: '', direccion: '' })
  const [guardandoEditar, setGuardandoEditar] = useState(false)

  const [clienteBaja, setClienteBaja] = useState<ClienteItem | null>(null)
  const [dandoBaja, setDandoBaja] = useState(false)

  const cargarClientes = useCallback(
    async (q?: string) => {
      setCargando(true)
      try {
        const data = await clientesApi.listar(q)
        setClientes(data)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'No se pudo cargar los clientes'
        toast.error(msg)
      } finally {
        setCargando(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    let active = true
    clientesApi
      .listar()
      .then((data) => {
        if (active) setClientes(data)
      })
      .catch((err) => {
        if (active) {
          toast.error(err instanceof ApiError ? err.message : 'No se pudo cargar los clientes')
        }
      })
      .finally(() => {
        if (active) setCargando(false)
      })
    return () => {
      active = false
    }
  }, [toast])

  const handleBuscar = (e: FormEvent) => {
    e.preventDefault()
    void cargarClientes(busqueda)
  }

  const handleCrear = async (e: FormEvent) => {
    e.preventDefault()
    setGuardandoCrear(true)
    try {
      await clientesApi.crear({
        ci: formCrear.ci,
        nombres: formCrear.nombres,
        apellidos: formCrear.apellidos,
        email: formCrear.email,
        telefono: formCrear.telefono || undefined,
        direccion: formCrear.direccion || undefined,
        password: formCrear.password,
        rol: formCrear.rol,
      })
      toast.success('Cliente registrado correctamente')
      setModalCrear(false)
      setFormCrear(INITIAL_FORM)
      await cargarClientes(busqueda)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al registrar cliente')
    } finally {
      setGuardandoCrear(false)
    }
  }

  const abrirEditar = (cliente: ClienteItem) => {
    setClienteEditar(cliente)
    setFormEditar({
      email: cliente.email,
      telefono: cliente.telefono ?? '',
      direccion: cliente.direccion ?? '',
    })
  }

  const handleEditar = async (e: FormEvent) => {
    e.preventDefault()
    if (!clienteEditar) return
    setGuardandoEditar(true)
    try {
      await clientesApi.actualizar(clienteEditar.id, {
        email: formEditar.email,
        telefono: formEditar.telefono || null,
        direccion: formEditar.direccion || null,
      })
      toast.success('Cliente actualizado')
      setClienteEditar(null)
      await cargarClientes(busqueda)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al actualizar cliente')
    } finally {
      setGuardandoEditar(false)
    }
  }

  const handleBaja = async () => {
    if (!clienteBaja) return
    setDandoBaja(true)
    try {
      await clientesApi.darDeBaja(clienteBaja.id)
      toast.success('Cliente dado de baja')
      setClienteBaja(null)
      await cargarClientes(busqueda)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al dar de baja')
    } finally {
      setDandoBaja(false)
    }
  }

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">Clientes</h1>
          <p className="page-subtitle-ds">
            Gestión de altas, modificaciones y bajas lógicas de clientes del banco.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalCrear(true)}>
          <Plus size={16} />
          Nuevo cliente
        </Button>
      </header>

      <Card>
        <form
          onSubmit={handleBuscar}
          className="table-controls-ds"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div className="search-filter-box" style={{ flex: '1 1 260px', minWidth: '220px' }}>
            <Input
              id="buscar-cliente"
              aria-label="Buscar por CI o nombre"
              placeholder="Buscar por CI o nombre (ej. 6000001 o Carlos)..."
              leftIcon={<Search size={18} />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button type="submit" variant="secondary">
              <Search size={16} />
              Buscar
            </Button>
            {busqueda && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setBusqueda('')
                  void cargarClientes('')
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </form>

        {cargando ? (
          <div style={{ padding: '2rem', textAlign: 'center' }} className="muted">
            Cargando clientes…
          </div>
        ) : clientes.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron clientes con ese criterio."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CI</TableHead>
                <TableHead>Nombre completo</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.ci}</TableCell>
                  <TableCell>
                    {c.nombres} {c.apellidos}
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.telefono ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.rol} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirEditar(c)}
                        title="Editar contacto"
                        aria-label={`Editar contacto de ${c.nombres} ${c.apellidos}`}
                      >
                        <Edit2 size={14} />
                      </Button>
                      {c.estado === 'ACTIVO' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setClienteBaja(c)}
                          title="Dar de baja"
                          aria-label={`Dar de baja a ${c.nombres} ${c.apellidos}`}
                        >
                          <UserX size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        title="Registrar nuevo cliente"
        size="md"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setModalCrear(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-crear-cliente" variant="primary" disabled={guardandoCrear}>
              {guardandoCrear ? 'Guardando…' : 'Registrar'}
            </Button>
          </>
        }
      >
        <form
          id="form-crear-cliente"
          onSubmit={handleCrear}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <Input
            id="crear-ci"
            label="CI"
            required
            value={formCrear.ci}
            onChange={(e) => setFormCrear({ ...formCrear, ci: e.target.value })}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <Input
              id="crear-nombres"
              label="Nombres"
              required
              value={formCrear.nombres}
              onChange={(e) => setFormCrear({ ...formCrear, nombres: e.target.value })}
            />
            <Input
              id="crear-apellidos"
              label="Apellidos"
              required
              value={formCrear.apellidos}
              onChange={(e) => setFormCrear({ ...formCrear, apellidos: e.target.value })}
            />
          </div>
          <Input
            id="crear-email"
            label="Correo electrónico"
            type="email"
            required
            value={formCrear.email}
            onChange={(e) => setFormCrear({ ...formCrear, email: e.target.value })}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <Input
              id="crear-telefono"
              label="Teléfono"
              value={formCrear.telefono}
              onChange={(e) => setFormCrear({ ...formCrear, telefono: e.target.value })}
            />
            <Select
              id="crear-rol"
              label="Rol"
              value={formCrear.rol}
              onChange={(e) => setFormCrear({ ...formCrear, rol: e.target.value as Rol })}
              options={[
                { value: 'CLIENTE', label: 'Cliente' },
                { value: 'ADMIN', label: 'Administrador' },
              ]}
            />
          </div>
          <Input
            id="crear-direccion"
            label="Dirección"
            value={formCrear.direccion}
            onChange={(e) => setFormCrear({ ...formCrear, direccion: e.target.value })}
          />
          <Input
            id="crear-password"
            label="Contraseña inicial"
            type="password"
            required
            minLength={6}
            value={formCrear.password}
            onChange={(e) => setFormCrear({ ...formCrear, password: e.target.value })}
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(clienteEditar)}
        onClose={() => setClienteEditar(null)}
        title={`Editar cliente (${clienteEditar?.ci ?? ''})`}
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setClienteEditar(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-editar-cliente" variant="primary" disabled={guardandoEditar}>
              {guardandoEditar ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <form
          id="form-editar-cliente"
          onSubmit={handleEditar}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <Input
            id="editar-email"
            label="Correo electrónico"
            type="email"
            required
            value={formEditar.email}
            onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })}
          />
          <Input
            id="editar-telefono"
            label="Teléfono"
            value={formEditar.telefono}
            onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
          />
          <Input
            id="editar-direccion"
            label="Dirección"
            value={formEditar.direccion}
            onChange={(e) => setFormEditar({ ...formEditar, direccion: e.target.value })}
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(clienteBaja)}
        onClose={() => setClienteBaja(null)}
        title="Confirmar baja lógica"
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setClienteBaja(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" disabled={dandoBaja} onClick={handleBaja}>
              {dandoBaja ? 'Procesando…' : 'Confirmar baja'}
            </Button>
          </>
        }
      >
        <p style={{ lineHeight: 1.5 }}>
          ¿Dar de baja a{' '}
          <strong>
            {clienteBaja?.nombres} {clienteBaja?.apellidos}
          </strong>{' '}
          (CI {clienteBaja?.ci})? No podrá iniciar sesión, pero su historial se conservará.
        </p>
      </Modal>
    </div>
  )
}
