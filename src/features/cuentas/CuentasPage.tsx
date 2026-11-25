import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, Modal, useToast } from '../../components'
import { formatCurrency } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'
import { ExtractoCuenta } from './components/ExtractoCuenta'
import { cuentasApi, mensajeError, type Cuenta } from './cuentas.api'
import './cuentas.css'

type Dialogo =
  | { tipo: 'abrir' }
  | {
      tipo: 'alias' | 'depositar' | 'retirar' | 'cerrar' | 'extracto'
      cuenta: Cuenta
    }

const titulos = {
  abrir: 'Abrir cuenta de ahorro',
  alias: 'Editar alias',
  depositar: 'Depositar',
  retirar: 'Retirar',
  cerrar: 'Cerrar cuenta',
  extracto: 'Extracto',
}

const uuidPattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

export function CuentasPage() {
  const esAdmin = useAuth().usuario?.rol === 'ADMIN'
  const toast = useToast()
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null)
  const [filtro, setFiltro] = useState('')
  const [recarga, setRecarga] = useState(0)
  const [errorCarga, setErrorCarga] = useState('')
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [errorOperacion, setErrorOperacion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const operacionEnCurso = useRef(false)
  const ultimoIntento = useRef<{ contenido: string; referencia: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    cuentasApi
      .listar(filtro, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setCuentas(data)
          setErrorCarga('')
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setErrorCarga(mensajeError(cause))
      })
    return () => controller.abort()
  }, [filtro, recarga])

  function abrirDialogo(nuevo: Dialogo) {
    setErrorOperacion('')
    setDialogo(nuevo)
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dialogo || dialogo.tipo === 'extracto' || operacionEnCurso.current) return
    const form = new FormData(event.currentTarget)
    operacionEnCurso.current = true
    setGuardando(true)
    setErrorOperacion('')

    try {
      switch (dialogo.tipo) {
        case 'abrir':
          await cuentasApi.abrir(
            String(form.get('alias')),
            esAdmin ? String(form.get('clienteId')).trim() : undefined,
          )
          break
        case 'alias':
          await cuentasApi.editar(dialogo.cuenta.id, String(form.get('alias')))
          break
        case 'cerrar':
          await cuentasApi.cerrar(dialogo.cuenta.id)
          break
        case 'depositar':
        case 'retirar': {
          const monto = Number(form.get('monto'))
          const glosa = String(form.get('glosa')).trim()
          const operacion = dialogo.tipo === 'depositar' ? 'depositos' : 'retiros'
          const contenido = JSON.stringify([dialogo.cuenta.id, operacion, monto, glosa])
          if (ultimoIntento.current?.contenido !== contenido) {
            ultimoIntento.current = { contenido, referencia: crypto.randomUUID() }
          }
          await cuentasApi.mover(
            dialogo.cuenta.id,
            operacion,
            monto,
            glosa,
            ultimoIntento.current.referencia,
          )
          ultimoIntento.current = null
          break
        }
      }
      toast.success('La operación se completó.')
      setDialogo(null)
      setRecarga((actual) => actual + 1)
    } catch (cause) {
      setErrorOperacion(mensajeError(cause))
    } finally {
      operacionEnCurso.current = false
      setGuardando(false)
    }
  }

  const cuentaEnDialogo = dialogo && 'cuenta' in dialogo ? dialogo.cuenta : null
  const esMovimiento = dialogo?.tipo === 'depositar' || dialogo?.tipo === 'retirar'

  return (
    <div className="cuentas-page">
      <header className="page-header-ds">
        <h1 className="page-title-ds">{esAdmin ? 'Cuentas de ahorro' : 'Mis cuentas de ahorro'}</h1>
        <Button leftIcon={<Plus size={17} />} onClick={() => abrirDialogo({ tipo: 'abrir' })}>
          Abrir cuenta
        </Button>
      </header>

      {esAdmin && (
        <form
          className="cuentas-filtro"
          onSubmit={(event) => {
            event.preventDefault()
            const clienteId = String(new FormData(event.currentTarget).get('filtroCliente')).trim()
            if (clienteId === filtro) return
            setErrorCarga('')
            setCuentas(null)
            setFiltro(clienteId)
          }}
        >
          <Input
            name="filtroCliente"
            label="ID del cliente"
            placeholder="Todas las cuentas"
            pattern={uuidPattern}
          />
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
      )}

      {errorCarga ? (
        <div className="cuentas-carga-error">
          <p role="alert" className="form-error-ds">
            {errorCarga}
          </p>
          <Button variant="outline" onClick={() => setRecarga((actual) => actual + 1)}>
            Reintentar
          </Button>
        </div>
      ) : !cuentas ? (
        <p role="status">Cargando cuentas…</p>
      ) : cuentas.length === 0 ? (
        <EmptyState
          title="No hay cuentas de ahorro"
          description={filtro ? 'El cliente no tiene cuentas.' : undefined}
        />
      ) : (
        <div className="cuentas-grid">
          {cuentas.map((cuenta) => (
            <Card
              key={cuenta.id}
              title={cuenta.alias || 'Cuenta de ahorro'}
              subtitle={cuenta.numero}
              action={
                <Badge variant={cuenta.estado === 'ACTIVA' ? 'success' : 'neutral'}>
                  {cuenta.estado === 'ACTIVA' ? 'Activa' : 'Cerrada'}
                </Badge>
              }
            >
              <div className="cuentas-saldo">
                <Wallet size={18} aria-hidden="true" />
                <span>Saldo disponible</span>
                <strong>{formatCurrency(cuenta.saldo)}</strong>
              </div>
              {esAdmin && <p className="cuentas-titular">Cliente {cuenta.clienteId}</p>}
              <div className="cuentas-acciones">
                {cuenta.estado === 'ACTIVA' && (
                  <>
                    <Button size="sm" onClick={() => abrirDialogo({ tipo: 'depositar', cuenta })}>
                      Depositar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirDialogo({ tipo: 'retirar', cuenta })}
                    >
                      Retirar
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => abrirDialogo({ tipo: 'extracto', cuenta })}
                >
                  Extracto
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => abrirDialogo({ tipo: 'alias', cuenta })}
                >
                  Editar alias
                </Button>
                {cuenta.estado === 'ACTIVA' && cuenta.saldo === 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => abrirDialogo({ tipo: 'cerrar', cuenta })}
                  >
                    Cerrar cuenta
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(dialogo)}
        onClose={() => {
          if (!operacionEnCurso.current) setDialogo(null)
        }}
        title={dialogo ? titulos[dialogo.tipo] : undefined}
        size={dialogo?.tipo === 'extracto' ? 'xl' : 'md'}
      >
        {dialogo?.tipo === 'extracto' ? (
          <>
            <p className="cuentas-contexto">Cuenta {dialogo.cuenta.numero}</p>
            <ExtractoCuenta key={dialogo.cuenta.id} id={dialogo.cuenta.id} />
          </>
        ) : (
          dialogo && (
            <form className="cuentas-form" onSubmit={guardar}>
              {cuentaEnDialogo && (
                <p className="cuentas-contexto">
                  Cuenta {cuentaEnDialogo.numero} · {formatCurrency(cuentaEnDialogo.saldo)}
                </p>
              )}
              {dialogo.tipo === 'abrir' && esAdmin && (
                <Input
                  name="clienteId"
                  label="ID del cliente"
                  pattern={uuidPattern}
                  required
                  disabled={guardando}
                />
              )}
              {(dialogo.tipo === 'abrir' || dialogo.tipo === 'alias') && (
                <Input
                  name="alias"
                  label="Alias (opcional)"
                  maxLength={50}
                  defaultValue={cuentaEnDialogo?.alias ?? ''}
                  disabled={guardando}
                />
              )}
              {esMovimiento && (
                <>
                  <Input
                    name="monto"
                    label="Monto (Bs)"
                    type="number"
                    min="0.01"
                    max="999999999999.99"
                    step="0.01"
                    required
                    disabled={guardando}
                  />
                  <Input
                    name="glosa"
                    label="Glosa (opcional)"
                    maxLength={150}
                    disabled={guardando}
                  />
                </>
              )}
              {dialogo.tipo === 'cerrar' && (
                <p>La cuenta quedará cerrada y podrás seguir consultando su extracto.</p>
              )}
              {errorOperacion && (
                <p role="alert" className="form-error-ds">
                  {errorOperacion}
                </p>
              )}
              <div className="cuentas-form-acciones">
                <Button variant="outline" disabled={guardando} onClick={() => setDialogo(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant={dialogo.tipo === 'cerrar' ? 'danger' : 'primary'}
                  isLoading={guardando}
                >
                  {dialogo.tipo === 'alias' ? 'Guardar alias' : titulos[dialogo.tipo]}
                </Button>
              </div>
            </form>
          )
        )}
      </Modal>
    </div>
  )
}
