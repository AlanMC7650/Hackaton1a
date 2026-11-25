import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Receipt,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../../components'
import type { BadgeVariant } from '../../components'
import { ApiError } from '../../services/api'
import type { EstadoPago } from '../../types'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { pagosApi } from './pagos.service'
import type { CuentaResumen, DeudaServicio, EmpresaServicio, PagoRegistro } from './pagos.types'

const ESTADO_BADGE: Record<EstadoPago, { label: string; variant: BadgeVariant }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  COMPLETADO: { label: 'Completado', variant: 'success' },
  RECHAZADO: { label: 'Rechazado', variant: 'danger' },
  REVERTIDO: { label: 'Revertido', variant: 'warning' },
}

function getAlertClass(estado: EstadoPago): string {
  if (estado === 'COMPLETADO') return 'glass-alert-success'
  if (estado === 'REVERTIDO') return 'glass-alert-warning'
  if (estado === 'RECHAZADO') return 'glass-alert-danger'
  return 'glass-alert-info'
}

export function PagosPage() {
  const toast = useToast()

  const [empresas, setEmpresas] = useState<EmpresaServicio[]>([])
  const [cuentas, setCuentas] = useState<CuentaResumen[]>([])
  const [pagos, setPagos] = useState<PagoRegistro[]>([])

  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [cuentasNoDisponibles, setCuentasNoDisponibles] = useState(false)

  const [empresaCodigo, setEmpresaCodigo] = useState('')
  const [codigoServicio, setCodigoServicio] = useState('')
  const [cuentaId, setCuentaId] = useState('')
  const [cuentaIdManual, setCuentaIdManual] = useState('')

  const [consultandoDeuda, setConsultandoDeuda] = useState(false)
  const [deuda, setDeuda] = useState<DeudaServicio | null>(null)
  const [errorDeuda, setErrorDeuda] = useState<string | null>(null)

  const [procesandoPago, setProcesandoPago] = useState(false)
  const [ultimoPago, setUltimoPago] = useState<PagoRegistro | null>(null)

  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [recargandoHistorial, setRecargandoHistorial] = useState(false)

  const cuentasActivas = useMemo(
    () => cuentas.filter((cuenta) => cuenta.estado === 'ACTIVA'),
    [cuentas],
  )

  const cargarHistorial = useCallback(async () => {
    setRecargandoHistorial(true)
    try {
      const lista = await pagosApi.listarPagos()
      setPagos(lista)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo cargar el historial de pagos'
      toast.error(msg)
    } finally {
      setRecargandoHistorial(false)
    }
  }, [toast])

  const cargarCuentas = useCallback(async () => {
    try {
      const lista = await pagosApi.listarCuentas()
      setCuentas(lista)
      setCuentasNoDisponibles(false)
      const primeraActiva = lista.find((c) => c.estado === 'ACTIVA')
      if (primeraActiva) {
        setCuentaId((prev) => prev || primeraActiva.id)
      }
    } catch {
      setCuentasNoDisponibles(true)
    }
  }, [])

  useEffect(() => {
    let activo = true

    async function inicializar() {
      setCargandoInicial(true)
      try {
        const [empresasRes, pagosRes] = await Promise.all([
          pagosApi.listarEmpresas(),
          pagosApi.listarPagos(),
        ])
        if (!activo) return
        setEmpresas(empresasRes)
        setPagos(pagosRes)
        if (empresasRes.length > 0) {
          setEmpresaCodigo((prev) => prev || empresasRes[0].codigo)
        }
      } catch (err) {
        if (!activo) return
        const msg = err instanceof ApiError ? err.message : 'Error al cargar el módulo de pagos'
        toast.error(msg)
      } finally {
        if (activo) setCargandoInicial(false)
      }

      if (activo) {
        await cargarCuentas()
      }
    }

    void inicializar()
    return () => {
      activo = false
    }
  }, [cargarCuentas, toast])

  const onConsultarDeuda = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorDeuda(null)
    setDeuda(null)
    setUltimoPago(null)

    if (!empresaCodigo) {
      setErrorDeuda('Selecciona una empresa de servicio.')
      return
    }
    if (!codigoServicio.trim()) {
      setErrorDeuda('Ingresa el código de cliente del servicio.')
      return
    }

    setConsultandoDeuda(true)
    try {
      const resultado = await pagosApi.consultarDeuda(empresaCodigo, codigoServicio.trim())
      setDeuda(resultado)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo consultar la deuda'
      setErrorDeuda(msg)
    } finally {
      setConsultandoDeuda(false)
    }
  }

  const onPagarServicio = async () => {
    if (!deuda) return

    const cuentaSeleccionada = cuentasNoDisponibles ? cuentaIdManual.trim() : cuentaId
    if (!cuentaSeleccionada) {
      toast.warning('Selecciona una cuenta activa para debitar el pago')
      return
    }

    setProcesandoPago(true)
    setUltimoPago(null)

    try {
      const pago = await pagosApi.pagar({
        cuentaId: cuentaSeleccionada,
        empresaCodigo: deuda.empresa.codigo,
        codigoClienteServicio: deuda.codigoCliente,
      })
      setUltimoPago(pago)
      setDeuda(null)
      toast.success(`Pago realizado. Comprobante ${pago.comprobante ?? ''}`.trim())
      await Promise.all([cargarHistorial(), cargarCuentas()])
    } catch (err) {
      const details =
        err instanceof ApiError && err.details && typeof err.details === 'object'
          ? (err.details as { pago?: PagoRegistro })
          : null

      if (details?.pago) {
        setUltimoPago(details.pago)
        await Promise.all([cargarHistorial(), cargarCuentas()])
      }

      const msg = err instanceof ApiError ? err.message : 'No se pudo completar el pago'
      if (details?.pago?.estado === 'REVERTIDO') {
        toast.warning(msg)
      } else {
        toast.error(msg)
      }
    } finally {
      setProcesandoPago(false)
    }
  }

  const empresaOpciones = useMemo(
    () =>
      empresas.map((empresa) => ({
        value: empresa.codigo,
        label: `${empresa.nombre} (${empresa.codigo})`,
      })),
    [empresas],
  )

  const cuentaOpciones = useMemo(
    () =>
      cuentasActivas.map((cuenta) => ({
        value: cuenta.id,
        label: `${cuenta.numero}${cuenta.alias ? ` · ${cuenta.alias}` : ''} — Saldo: ${formatCurrency(cuenta.saldo)}`,
      })),
    [cuentasActivas],
  )

  const pagosFiltrados = useMemo(() => {
    const query = filtroBusqueda.trim().toLowerCase()
    return pagos.filter((pago) => {
      if (filtroEstado && pago.estado !== filtroEstado) return false
      if (!query) return true
      const empresaNombre = pago.empresa?.nombre?.toLowerCase() ?? ''
      const empresaCod = pago.empresa?.codigo?.toLowerCase() ?? ''
      const comprobante = pago.comprobante?.toLowerCase() ?? ''
      const codigo = pago.codigoClienteServicio.toLowerCase()
      return (
        empresaNombre.includes(query) ||
        empresaCod.includes(query) ||
        comprobante.includes(query) ||
        codigo.includes(query)
      )
    })
  }, [pagos, filtroBusqueda, filtroEstado])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="page-header-ds" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title-ds">Pagos de Servicios</h1>
          <p className="page-subtitle-ds">
            Consulta tu deuda de luz, agua, telefonía o gas y realiza el pago directo desde tu
            cuenta de ahorro.
          </p>
        </div>
      </header>

      <div className="stats-grid-ds" style={{ marginBottom: 0 }}>
        <Card className="stat-card">
          <div className="stat-icon-wrapper brand">
            <Receipt size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Empresas habilitadas</span>
            <span className="stat-value">{empresas.length}</span>
            <span className="stat-footnote">Luz, Agua, Telefonía y Gas</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon-wrapper success">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pagos completados</span>
            <span className="stat-value">
              {pagos.filter((p) => p.estado === 'COMPLETADO').length}
            </span>
            <span className="stat-footnote">Con comprobante emitido</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon-wrapper warning">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pagos revertidos</span>
            <span className="stat-value">
              {pagos.filter((p) => p.estado === 'REVERTIDO').length}
            </span>
            <span className="stat-footnote">Compensación automática ante fallos</span>
          </div>
        </Card>
      </div>

      <Card
        title="Nuevo pago de servicio"
        subtitle="Primero consulta el monto pendiente y luego selecciona la cuenta de débito."
      >
        <form
          onSubmit={onConsultarDeuda}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div className="form-grid-2">
            <Select
              id="empresa-servicio"
              label="Empresa de servicio"
              options={empresaOpciones}
              placeholder={cargandoInicial ? 'Cargando empresas…' : 'Selecciona una empresa'}
              value={empresaCodigo}
              onChange={(event) => {
                setEmpresaCodigo(event.target.value)
                setDeuda(null)
                setErrorDeuda(null)
              }}
              disabled={cargandoInicial || consultandoDeuda || procesandoPago}
            />

            <Input
              id="codigo-cliente-servicio"
              label="Código de cliente / suministro"
              placeholder="Ej. 1001 (terminado en 999 simula fallo)"
              value={codigoServicio}
              onChange={(event) => {
                setCodigoServicio(event.target.value)
                setErrorDeuda(null)
              }}
              helperText="Prueba 1001 o 2001 para pago exitoso; códigos terminados en 999 activan reversión."
              disabled={consultandoDeuda || procesandoPago}
            />
          </div>

          {errorDeuda && (
            <div className="glass-alert-danger" role="alert">
              <XCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorDeuda}</span>
            </div>
          )}

          <div className="action-buttons-group">
            <Button
              type="submit"
              variant="secondary"
              isLoading={consultandoDeuda}
              leftIcon={<Search size={16} />}
              disabled={cargandoInicial || procesandoPago}
            >
              Consultar deuda
            </Button>
          </div>
        </form>

        {deuda && (
          <div
            className="glass-card-nested"
            style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  DEUDA ENCONTRADA · {deuda.empresa.nombre.toUpperCase()}
                </p>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px' }}>
                  {deuda.titular}
                </h4>
                <p
                  style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px' }}
                >
                  Código: <strong>{deuda.codigoCliente}</strong> · Periodo:{' '}
                  <strong>{deuda.periodo}</strong>
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block' }}
                >
                  Total a pagar
                </span>
                <strong style={{ fontSize: '1.65rem', color: 'var(--chuno-teal-accent)' }}>
                  {formatCurrency(deuda.monto)}
                </strong>
              </div>
            </div>

            {cuentasNoDisponibles ? (
              <Input
                id="cuenta-id-manual"
                label="ID de cuenta (UUID)"
                placeholder="ms-cuentas no disponible aún: ingresa el UUID de cuenta"
                value={cuentaIdManual}
                onChange={(event) => setCuentaIdManual(event.target.value)}
                helperText="No se pudo obtener el listado automático desde /api/cuentas."
                disabled={procesandoPago}
              />
            ) : (
              <Select
                id="cuenta-debito"
                label="Cuenta de débito"
                options={cuentaOpciones}
                placeholder={
                  cuentasActivas.length === 0
                    ? 'No tienes cuentas activas disponibles'
                    : 'Selecciona tu cuenta de ahorro'
                }
                value={cuentaId}
                onChange={(event) => setCuentaId(event.target.value)}
                disabled={procesandoPago || cuentasActivas.length === 0}
              />
            )}

            <div className="action-buttons-group">
              <Button
                type="button"
                variant="primary"
                isLoading={procesandoPago}
                leftIcon={<CreditCard size={16} />}
                onClick={() => void onPagarServicio()}
                disabled={
                  procesandoPago ||
                  (!cuentasNoDisponibles && (!cuentaId || cuentasActivas.length === 0)) ||
                  (cuentasNoDisponibles && !cuentaIdManual.trim())
                }
              >
                Confirmar y pagar {formatCurrency(deuda.monto)}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeuda(null)}
                disabled={procesandoPago}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {ultimoPago && (
          <div
            className={getAlertClass(ultimoPago.estado)}
            style={{ marginTop: '20px' }}
            role="status"
          >
            {ultimoPago.estado === 'COMPLETADO' ? (
              <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : ultimoPago.estado === 'REVERTIDO' ? (
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <XCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong>
                {ultimoPago.estado === 'COMPLETADO' && 'Pago procesado correctamente'}
                {ultimoPago.estado === 'REVERTIDO' && 'Pago revertido por compensación automática'}
                {ultimoPago.estado === 'RECHAZADO' && 'Pago rechazado'}
                {ultimoPago.estado === 'PENDIENTE' && 'Pago en estado pendiente'}
              </strong>
              <span>
                Servicio: <strong>{ultimoPago.empresa?.nombre ?? ultimoPago.empresaId}</strong> ·
                Código: <strong>{ultimoPago.codigoClienteServicio}</strong> · Monto:{' '}
                <strong>{formatCurrency(ultimoPago.monto)}</strong>
              </span>
              {ultimoPago.comprobante && (
                <span>
                  Comprobante: <strong>{ultimoPago.comprobante}</strong>
                </span>
              )}
              {ultimoPago.motivo && <span>Detalle: {ultimoPago.motivo}</span>}
              <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                Referencia: {ultimoPago.referencia}
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Historial de pagos"
        subtitle="Registro de pagos completados, rechazados y revertidos."
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            isLoading={recargandoHistorial}
            onClick={() => void cargarHistorial()}
          >
            Actualizar
          </Button>
        }
      >
        <div className="table-controls-ds">
          <div className="search-filter-box">
            <Input
              id="buscar-pagos"
              placeholder="Buscar por empresa, código o comprobante…"
              value={filtroBusqueda}
              onChange={(event) => setFiltroBusqueda(event.target.value)}
              leftIcon={<Search size={15} />}
            />
          </div>

          <div style={{ width: '210px' }}>
            <Select
              id="filtrar-estado-pago"
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
              placeholder="Todos los estados"
              options={[
                { value: 'COMPLETADO', label: 'Completado' },
                { value: 'REVERTIDO', label: 'Revertido' },
                { value: 'RECHAZADO', label: 'Rechazado' },
                { value: 'PENDIENTE', label: 'Pendiente' },
              ]}
            />
          </div>
        </div>

        {cargandoInicial ? (
          <EmptyState title="Cargando pagos…" description="Consultando tus registros recientes." />
        ) : pagosFiltrados.length === 0 ? (
          <EmptyState
            title="Sin pagos registrados"
            description="Cuando pagues un servicio básico verás aquí el comprobante o estado de compensación."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comprobante / Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagosFiltrados.map((pago) => {
                const badge = ESTADO_BADGE[pago.estado]
                return (
                  <TableRow key={pago.id}>
                    <TableCell>{formatDateTime(pago.createdAt)}</TableCell>
                    <TableCell>
                      <strong>{pago.empresa?.nombre ?? 'Servicio'}</strong>{' '}
                      {pago.empresa?.codigo && (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                          ({pago.empresa.codigo})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{pago.codigoClienteServicio}</TableCell>
                    <TableCell>{pago.periodo}</TableCell>
                    <TableCell>
                      <strong>{formatCurrency(pago.monto)}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {pago.comprobante ? (
                        <span className="hash-badge-ds">{pago.comprobante}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                          {pago.motivo ?? '—'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
