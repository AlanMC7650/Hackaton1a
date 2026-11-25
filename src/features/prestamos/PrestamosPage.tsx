import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Calculator, CheckCircle2, Eye, Landmark, Send, XCircle, Ban } from 'lucide-react'
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
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { PlanCuotasTable } from './components/PlanCuotasTable'
import { prestamosApi } from './prestamos.api'
import type { CuentaOpcion, Prestamo, Simulacion } from './prestamos.api'

const TASA_POR_DEFECTO = '14'

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    const issues = Array.isArray(error.details) ? (error.details as Array<{ message?: string }>) : []
    return issues[0]?.message ?? error.message
  }
  return 'No se pudo completar la operación'
}

export function PrestamosPage() {
  const { usuario } = useAuth()
  const toast = useToast()
  const esAdmin = usuario?.rol === 'ADMIN'

  const [monto, setMonto] = useState('10000')
  const [plazo, setPlazo] = useState('12')
  const [tasa, setTasa] = useState(TASA_POR_DEFECTO)
  const [cuentaId, setCuentaId] = useState('')

  const [simulacion, setSimulacion] = useState<Simulacion | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [cuentas, setCuentas] = useState<CuentaOpcion[]>([])
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [cargando, setCargando] = useState(true)
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null)

  const [detalle, setDetalle] = useState<Prestamo | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [lista, ctas] = await Promise.all([
        prestamosApi.listar(),
        prestamosApi.cuentasActivas().catch(() => [] as CuentaOpcion[]),
      ])
      setPrestamos(lista)
      setCuentas(ctas)
    } catch (error) {
      toast.error(mensajeError(error), 'Préstamos')
    } finally {
      setCargando(false)
    }
  }, [toast])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const datosFormulario = () => ({
    monto: Number(monto),
    plazoMeses: Number(plazo),
    tasaAnual: Number(tasa),
  })

  const simular = async () => {
    setSimulando(true)
    try {
      setSimulacion(await prestamosApi.simular(datosFormulario()))
    } catch (error) {
      setSimulacion(null)
      toast.error(mensajeError(error), 'Simulación')
    } finally {
      setSimulando(false)
    }
  }

  const solicitar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cuentaId) {
      toast.warning('Elige la cuenta donde se desembolsará el préstamo')
      return
    }
    setEnviando(true)
    try {
      const creado = await prestamosApi.crear({ ...datosFormulario(), cuentaDesembolsoId: cuentaId })
      toast.success(`Préstamo de ${formatCurrency(creado.monto)} solicitado`, 'Solicitud registrada')
      setSimulacion(null)
      await cargar()
    } catch (error) {
      toast.error(mensajeError(error), 'Solicitud')
    } finally {
      setEnviando(false)
    }
  }

  const ejecutar = async (prestamo: Prestamo, accion: 'aprobar' | 'rechazar' | 'cancelar') => {
    const textos = {
      aprobar: `¿Aprobar y desembolsar ${formatCurrency(prestamo.monto)} en la cuenta ${prestamo.cuentaDesembolsoNumero}?`,
      rechazar: '¿Rechazar esta solicitud de préstamo?',
      cancelar: '¿Cancelar esta solicitud de préstamo?',
    }
    if (!window.confirm(textos[accion])) return

    setAccionEnCurso(`${prestamo.id}:${accion}`)
    try {
      await prestamosApi[accion](prestamo.id)
      const ok = {
        aprobar: 'Préstamo aprobado y desembolsado',
        rechazar: 'Préstamo rechazado',
        cancelar: 'Préstamo cancelado',
      }
      toast.success(ok[accion])
      await cargar()
    } catch (error) {
      toast.error(mensajeError(error), 'Préstamos')
    } finally {
      setAccionEnCurso(null)
    }
  }

  const verPlan = async (prestamo: Prestamo) => {
    try {
      setDetalle(await prestamosApi.obtener(prestamo.id))
    } catch (error) {
      toast.error(mensajeError(error), 'Plan de cuotas')
    }
  }

  const opcionesCuenta = useMemo(
    () =>
      cuentas.map((cuenta) => ({
        value: cuenta.id,
        label: `${cuenta.numero}${cuenta.alias ? ` · ${cuenta.alias}` : ''}${
          cuenta.saldo !== undefined ? ` · ${formatCurrency(cuenta.saldo)}` : ''
        }`,
      })),
    [cuentas],
  )

  const resumen = useMemo(() => {
    const aprobados = prestamos.filter((p) => p.estado === 'APROBADO')
    return {
      pendientes: prestamos.filter((p) => p.estado === 'SOLICITADO').length,
      aprobados: aprobados.length,
      desembolsado: aprobados.reduce((acc, p) => acc + Number(p.monto), 0),
    }
  }, [prestamos])

  return (
    <div className="space-y-6">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">{esAdmin ? 'Préstamos' : 'Mis Préstamos'}</h1>
          <p className="page-subtitle-ds">
            Simula tu cuota fija (sistema francés), solicita un préstamo y revisa su plan de cuotas.
          </p>
        </div>
      </header>

      <section className="stats-grid-ds">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Solicitudes pendientes</span>
            <span className="stat-value">{resumen.pendientes}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Préstamos aprobados</span>
            <span className="stat-value">{resumen.aprobados}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total desembolsado</span>
            <span className="stat-value">{formatCurrency(resumen.desembolsado)}</span>
          </div>
        </div>
      </section>

      <Card title="Simulador y solicitud" subtitle="La cuota se calcula con tasa anual fija y plazo de 1 a 60 meses.">
        <form onSubmit={solicitar} noValidate>
          <div className="form-grid-2">
            <Input
              id="prestamo-monto"
              label="Monto (Bs)"
              type="number"
              min={1}
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
            <Input
              id="prestamo-plazo"
              label="Plazo (meses)"
              type="number"
              min={1}
              max={60}
              value={plazo}
              onChange={(e) => setPlazo(e.target.value)}
            />
            <Input
              id="prestamo-tasa"
              label="Tasa anual (%)"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
            />
            <Select
              id="prestamo-cuenta"
              label="Cuenta de desembolso"
              placeholder={cuentas.length ? 'Selecciona una cuenta' : 'No hay cuentas activas'}
              options={opcionesCuenta}
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
            />
          </div>

          {simulacion && (
            <div className="stats-grid-ds" style={{ marginTop: 16 }}>
              <div className="stat-card">
                <div className="stat-content">
                  <span className="stat-label">Cuota mensual</span>
                  <span className="stat-value">{formatCurrency(simulacion.cuotaMensual)}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <span className="stat-label">Total intereses</span>
                  <span className="stat-value">{formatCurrency(simulacion.totalInteres)}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <span className="stat-label">Total a pagar</span>
                  <span className="stat-value">{formatCurrency(simulacion.totalPagar)}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <Button variant="secondary" onClick={simular} isLoading={simulando} leftIcon={<Calculator size={16} />}>
              Simular cuota
            </Button>
            <Button type="submit" variant="primary" isLoading={enviando} leftIcon={<Send size={16} />}>
              Solicitar préstamo
            </Button>
          </div>

          {simulacion && (
            <div style={{ marginTop: 16 }}>
              <PlanCuotasTable cuotas={simulacion.cuotas} />
            </div>
          )}
        </form>
      </Card>

      <Card
        title={esAdmin ? 'Solicitudes y préstamos' : 'Mis préstamos'}
        subtitle={esAdmin ? 'Aprueba para acreditar el monto en la cuenta del cliente.' : undefined}
      >
        {cargando ? (
          <p className="muted">Cargando…</p>
        ) : prestamos.length === 0 ? (
          <EmptyState
            icon={<Landmark size={42} />}
            title="Sin préstamos"
            description="Simula y solicita tu primer préstamo con el formulario de arriba."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Tasa</TableHead>
                <TableHead className="text-right">Plazo</TableHead>
                <TableHead className="text-right">Cuota</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestamos.map((p) => {
                const solicitado = p.estado === 'SOLICITADO'
                const ocupado = accionEnCurso?.startsWith(p.id) ?? false
                return (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>{p.cuentaDesembolsoNumero}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.monto)}</TableCell>
                    <TableCell className="text-right">{Number(p.tasaAnual).toFixed(2)} %</TableCell>
                    <TableCell className="text-right">{p.plazoMeses} m</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.cuotaMensual)}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.estado} />
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Button size="sm" variant="ghost" onClick={() => verPlan(p)} leftIcon={<Eye size={14} />}>
                          Plan
                        </Button>
                        {esAdmin && solicitado && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={ocupado}
                              isLoading={accionEnCurso === `${p.id}:aprobar`}
                              onClick={() => ejecutar(p, 'aprobar')}
                              leftIcon={<CheckCircle2 size={14} />}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={ocupado}
                              isLoading={accionEnCurso === `${p.id}:rechazar`}
                              onClick={() => ejecutar(p, 'rechazar')}
                              leftIcon={<XCircle size={14} />}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                        {solicitado && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={ocupado}
                            isLoading={accionEnCurso === `${p.id}:cancelar`}
                            onClick={() => ejecutar(p, 'cancelar')}
                            leftIcon={<Ban size={14} />}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={detalle !== null}
        onClose={() => setDetalle(null)}
        size="xl"
        title={detalle ? `Plan de cuotas · ${formatCurrency(detalle.monto)} a ${detalle.plazoMeses} meses` : ''}
      >
        {detalle && (
          <div className="space-y-6">
            <p className="muted">
              Cuenta {detalle.cuentaDesembolsoNumero} · Tasa {Number(detalle.tasaAnual).toFixed(2)} % anual · Cuota fija{' '}
              <strong>{formatCurrency(detalle.cuotaMensual)}</strong> · Estado <StatusBadge status={detalle.estado} />
            </p>
            <PlanCuotasTable cuotas={detalle.cuotas ?? []} />
          </div>
        )}
      </Modal>
    </div>
  )
}
