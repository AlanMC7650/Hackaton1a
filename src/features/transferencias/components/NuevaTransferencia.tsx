import { useState } from 'react'
import type { FormEvent } from 'react'
import { Landmark, Users, Wallet } from 'lucide-react'
import { Button, Card, Input, Modal, Select, useToast } from '../../../components'
import { ApiError } from '../../../services/api'
import type { TipoTransferencia } from '../../../types'
import { formatCurrency } from '../../../utils/formatters'
import { crearTransferencia } from '../transferencias.api'
import { MONTO_MAXIMO } from '../types'
import type { Banco, CuentaResumen, NuevaTransferencia as Cuerpo, Transferencia } from '../types'
import { ResultadoTransferencia } from './ResultadoTransferencia'

interface NuevaTransferenciaProps {
  cuentas: CuentaResumen[]
  bancos: Banco[]
  errorBancos: string | null
  onCompletada: () => void
}

type Errores = Partial<Record<'origen' | 'destino' | 'banco' | 'titular' | 'monto' | 'glosa', string>>

const TABS: { tipo: TipoTransferencia; label: string; icono: typeof Wallet }[] = [
  { tipo: 'PROPIA', label: 'Propia', icono: Wallet },
  { tipo: 'TERCERO', label: 'Tercero', icono: Users },
  { tipo: 'INTERBANCARIA', label: 'Otro banco', icono: Landmark },
]

const TIPO_LABEL: Record<TipoTransferencia, string> = {
  PROPIA: 'Entre mis cuentas',
  TERCERO: 'A un cliente de Chuno',
  INTERBANCARIA: 'A otro banco',
}

function parseMonto(texto: string): number | null {
  const limpio = texto.trim()
  if (!/^\d+([.,]\d{1,2})?$/.test(limpio)) return null
  return Number(limpio.replace(',', '.'))
}

function etiquetaCuenta(cuenta: CuentaResumen): string {
  return `${cuenta.numero} · ${cuenta.alias ?? 'Ahorro'} · ${formatCurrency(cuenta.saldo)}`
}

export function NuevaTransferencia({
  cuentas,
  bancos,
  errorBancos,
  onCompletada,
}: NuevaTransferenciaProps) {
  const toast = useToast()

  const [tipo, setTipo] = useState<TipoTransferencia>('PROPIA')
  const [origenId, setOrigenId] = useState('')
  const [destinoPropioId, setDestinoPropioId] = useState('')
  const [numeroDestino, setNumeroDestino] = useState('')
  const [banco, setBanco] = useState('')
  const [titular, setTitular] = useState('')
  const [monto, setMonto] = useState('')
  const [glosa, setGlosa] = useState('')
  const [errores, setErrores] = useState<Errores>({})

  const [confirmando, setConfirmando] = useState(false)
  const [referencia, setReferencia] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Transferencia | null>(null)

  // Valores efectivos: si el usuario aún no eligió, se propone la primera cuenta válida.
  const origenEfectivo = cuentas.some((c) => c.id === origenId) ? origenId : (cuentas[0]?.id ?? '')
  const origen = cuentas.find((c) => c.id === origenEfectivo)
  const destinosPropios = cuentas.filter((c) => c.id !== origenEfectivo)
  const destinoPropioEfectivo = destinosPropios.some((c) => c.id === destinoPropioId)
    ? destinoPropioId
    : (destinosPropios[0]?.id ?? '')
  const destinoPropio = cuentas.find((c) => c.id === destinoPropioEfectivo)
  const bancoSeleccionado = bancos.find((b) => b.codigo === banco)

  const montoNumero = parseMonto(monto)
  const sinSaldoAviso = origen && montoNumero !== null && montoNumero > origen.saldo

  const cambiarTipo = (nuevo: TipoTransferencia) => {
    setTipo(nuevo)
    setErrores({})
  }

  const validar = (): Errores => {
    const nuevos: Errores = {}
    if (!origen) nuevos.origen = 'Elige la cuenta de origen'

    if (tipo === 'PROPIA' && !destinoPropio) nuevos.destino = 'Necesitas otra cuenta activa tuya'
    if (tipo === 'TERCERO') {
      if (!/^\d{10}$/.test(numeroDestino.trim())) nuevos.destino = 'El número de cuenta tiene 10 dígitos'
    }
    if (tipo === 'INTERBANCARIA') {
      if (!banco) nuevos.banco = 'Elige el banco destino'
      if (!numeroDestino.trim()) nuevos.destino = 'Escribe el número de cuenta destino'
      if (!titular.trim()) nuevos.titular = 'Escribe el titular de la cuenta'
    }

    if (montoNumero === null || montoNumero <= 0) {
      nuevos.monto = 'Escribe un monto mayor a 0 (máximo 2 decimales)'
    } else if (montoNumero > MONTO_MAXIMO) {
      nuevos.monto = `El máximo por transferencia es ${formatCurrency(MONTO_MAXIMO)}`
    }
    if (glosa.length > 150) nuevos.glosa = 'Máximo 150 caracteres'
    return nuevos
  }

  const alContinuar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setResultado(null)
    setErrorEnvio(null)
    setReferencia(crypto.randomUUID())
    setConfirmando(true)
  }

  const construirCuerpo = (): Cuerpo | null => {
    if (!origen || montoNumero === null) return null
    const comun = {
      cuentaOrigenId: origen.id,
      monto: montoNumero,
      glosa: glosa.trim() || undefined,
      referencia,
    }
    if (tipo === 'PROPIA' && destinoPropio) {
      return { ...comun, tipo, cuentaDestinoNumero: destinoPropio.numero }
    }
    if (tipo === 'TERCERO') {
      return { ...comun, tipo, cuentaDestinoNumero: numeroDestino.trim() }
    }
    if (tipo === 'INTERBANCARIA') {
      return {
        ...comun,
        tipo,
        bancoDestino: banco,
        cuentaDestinoNumero: numeroDestino.trim(),
        titularDestino: titular.trim(),
      }
    }
    return null
  }

  const enviar = async () => {
    const cuerpo = construirCuerpo()
    if (!cuerpo) return

    setEnviando(true)
    setErrorEnvio(null)
    try {
      const creada = await crearTransferencia(cuerpo)
      setResultado(creada)
      setConfirmando(false)
      setMonto('')
      setGlosa('')
      setNumeroDestino('')
      setTitular('')
      onCompletada()

      if (creada.estado === 'COMPLETADA') toast.success('Transferencia completada')
      else if (creada.estado === 'REVERTIDA') toast.warning('El dinero fue devuelto a tu cuenta')
      else toast.error(creada.motivo ?? 'Transferencia rechazada')
    } catch (error) {
      // Se conserva la referencia: reintentar no puede cobrar dos veces.
      setErrorEnvio(error instanceof ApiError ? error.message : 'No se pudo enviar la transferencia')
    } finally {
      setEnviando(false)
    }
  }

  const cerrarConfirmacion = () => {
    if (!enviando) setConfirmando(false)
  }

  if (cuentas.length === 0) {
    return (
      <Card title="Nueva transferencia">
        <p className="muted">Necesitas al menos una cuenta de ahorro activa para transferir.</p>
      </Card>
    )
  }

  return (
    <Card title="Nueva transferencia" subtitle="Elige el tipo, completa los datos y confirma antes de enviar.">
      <div className="segmented-control-ds" role="tablist" aria-label="Tipo de transferencia">
        {TABS.map(({ tipo: t, label, icono: Icono }) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tipo === t}
            className={`segmented-tab-ds ${tipo === t ? 'is-active' : ''}`}
            onClick={() => cambiarTipo(t)}
          >
            <Icono size={15} />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={alContinuar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select
          id="tr-origen"
          label="Cuenta de origen"
          value={origenEfectivo}
          onChange={(e) => setOrigenId(e.target.value)}
          options={cuentas.map((c) => ({ value: c.id, label: etiquetaCuenta(c) }))}
          error={errores.origen}
        />

        {tipo === 'PROPIA' && (
          <Select
            id="tr-destino-propio"
            label="Cuenta de destino (mía)"
            value={destinoPropioEfectivo}
            onChange={(e) => setDestinoPropioId(e.target.value)}
            options={destinosPropios.map((c) => ({ value: c.id, label: etiquetaCuenta(c) }))}
            placeholder={destinosPropios.length === 0 ? 'No tienes otra cuenta activa' : undefined}
            error={errores.destino}
            helperText={
              destinosPropios.length === 0
                ? 'Abre una segunda cuenta para transferir entre tus cuentas.'
                : undefined
            }
          />
        )}

        {tipo === 'TERCERO' && (
          <Input
            id="tr-destino"
            label="Número de cuenta destino (Chuno)"
            inputMode="numeric"
            maxLength={10}
            placeholder="10 dígitos"
            value={numeroDestino}
            onChange={(e) => setNumeroDestino(e.target.value.replace(/\D/g, ''))}
            error={errores.destino}
          />
        )}

        {tipo === 'INTERBANCARIA' && (
          <>
            <Select
              id="tr-banco"
              label="Banco destino"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              options={bancos.map((b) => ({ value: b.codigo, label: b.nombre }))}
              placeholder="Selecciona un banco"
              error={errores.banco ?? errorBancos ?? undefined}
            />
            <div className="form-grid-2">
              <Input
                id="tr-destino-externo"
                label="Número de cuenta destino"
                value={numeroDestino}
                onChange={(e) => setNumeroDestino(e.target.value.trim())}
                maxLength={30}
                error={errores.destino}
                helperText="Una cuenta que termina en 999 es rechazada por el intermediario (demo)."
              />
              <Input
                id="tr-titular"
                label="Titular de la cuenta"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                maxLength={150}
                error={errores.titular}
              />
            </div>
          </>
        )}

        <div className="form-grid-2">
          <Input
            id="tr-monto"
            label="Monto (Bs)"
            inputMode="decimal"
            placeholder="0,00"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            error={errores.monto}
            helperText={
              sinSaldoAviso
                ? 'El monto supera tu saldo: la operación será rechazada.'
                : `Máximo ${formatCurrency(MONTO_MAXIMO)} por transferencia`
            }
          />
          <Input
            id="tr-glosa"
            label="Glosa (opcional)"
            value={glosa}
            onChange={(e) => setGlosa(e.target.value)}
            maxLength={150}
            error={errores.glosa}
          />
        </div>

        <Button type="submit">Continuar</Button>
      </form>

      {resultado && (
        <div style={{ marginTop: 16 }}>
          <ResultadoTransferencia transferencia={resultado} onCerrar={() => setResultado(null)} />
        </div>
      )}

      <Modal
        isOpen={confirmando}
        onClose={cerrarConfirmacion}
        title="Confirma la transferencia"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={cerrarConfirmacion} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={() => void enviar()} isLoading={enviando}>
              Confirmar y enviar
            </Button>
          </>
        }
      >
        <dl style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0 }}>
          <Fila etiqueta="Tipo" valor={TIPO_LABEL[tipo]} />
          <Fila etiqueta="Desde" valor={origen ? `${origen.numero} (${origen.alias ?? 'Ahorro'})` : '—'} />
          {tipo === 'PROPIA' && <Fila etiqueta="Hacia" valor={destinoPropio?.numero ?? '—'} />}
          {tipo === 'TERCERO' && <Fila etiqueta="Hacia" valor={numeroDestino} />}
          {tipo === 'INTERBANCARIA' && (
            <>
              <Fila etiqueta="Banco" valor={bancoSeleccionado?.nombre ?? banco} />
              <Fila etiqueta="Cuenta" valor={numeroDestino} />
              <Fila etiqueta="Titular" valor={titular} />
            </>
          )}
          <Fila etiqueta="Monto" valor={montoNumero === null ? '—' : formatCurrency(montoNumero)} fuerte />
          {glosa.trim() && <Fila etiqueta="Glosa" valor={glosa.trim()} />}
        </dl>
        {sinSaldoAviso && (
          <p className="form-error-ds" role="alert">
            El monto supera el saldo de la cuenta de origen; la transferencia será rechazada.
          </p>
        )}
        {errorEnvio && (
          <p className="form-error-ds" role="alert">
            {errorEnvio}
          </p>
        )}
      </Modal>
    </Card>
  )
}

function Fila({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <dt className="text-muted">{etiqueta}</dt>
      <dd className={fuerte ? 'font-bold' : undefined}>{valor}</dd>
    </div>
  )
}
