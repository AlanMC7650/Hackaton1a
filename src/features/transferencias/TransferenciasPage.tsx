import { useCallback, useEffect, useState } from 'react'
import { Card } from '../../components'
import { ApiError } from '../../services/api'
import { useAuth } from '../auth/useAuth'
import { HistorialTransferencias } from './components/HistorialTransferencias'
import { NuevaTransferencia } from './components/NuevaTransferencia'
import { listarBancos, listarCuentasActivas, listarTransferencias } from './transferencias.api'
import type { Banco, CuentaResumen, Transferencia } from './types'

const mensaje = (error: unknown, porDefecto: string) =>
  error instanceof ApiError ? error.message : porDefecto

export function TransferenciasPage() {
  const { usuario } = useAuth()
  const esCliente = usuario?.rol === 'CLIENTE'

  const [cuentas, setCuentas] = useState<CuentaResumen[]>([])
  const [bancos, setBancos] = useState<Banco[]>([])
  const [errorBancos, setErrorBancos] = useState<string | null>(null)
  const [historial, setHistorial] = useState<Transferencia[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null)

  const cargarHistorial = useCallback(async () => {
    try {
      setHistorial(await listarTransferencias())
      setErrorHistorial(null)
    } catch (error) {
      setErrorHistorial(mensaje(error, 'No se pudo cargar el historial'))
    } finally {
      setCargandoHistorial(false)
    }
  }, [])

  const cargarCuentas = useCallback(async () => {
    try {
      setCuentas(await listarCuentasActivas())
    } catch {
      setCuentas([])
    }
  }, [])

  useEffect(() => {
    void cargarHistorial()
  }, [cargarHistorial])

  useEffect(() => {
    if (!esCliente) return
    void cargarCuentas()
    listarBancos()
      .then((lista) => {
        setBancos(lista)
        setErrorBancos(null)
      })
      .catch((error: unknown) => setErrorBancos(mensaje(error, 'No se pudo cargar la lista de bancos')))
  }, [esCliente, cargarCuentas])

  // Tras operar se refresca el historial y los saldos de las cuentas.
  const alCompletar = () => {
    void cargarHistorial()
    void cargarCuentas()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">Transferencias</h1>
          <p className="page-subtitle-ds">
            {esCliente
              ? 'Envía dinero entre tus cuentas, a otros clientes de Chuno o a otros bancos.'
              : 'Historial de transferencias de todos los clientes. Las operaciones las realiza cada cliente.'}
          </p>
        </div>
      </header>

      {esCliente && (
        <NuevaTransferencia
          cuentas={cuentas}
          bancos={bancos}
          errorBancos={errorBancos}
          onCompletada={alCompletar}
        />
      )}

      <Card title="Historial de transferencias">
        <HistorialTransferencias
          transferencias={historial}
          cuentas={cuentas}
          cargando={cargandoHistorial}
          error={errorHistorial}
        />
      </Card>
    </div>
  )
}
