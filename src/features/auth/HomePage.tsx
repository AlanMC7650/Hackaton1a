import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { StatusBadge } from '../../components'
import { getNavItemsForRole } from '../../config/navigation'
import { useAuth } from './useAuth'

export function HomePage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  if (!usuario) return null

  const navItems = getNavItemsForRole(usuario.rol).filter((item) => item.id !== 'inicio')

  return (
    <div className="dashboard-page space-y-8">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">Bienvenido/a, {usuario.nombreCompleto ?? usuario.email}</h1>
          <p className="page-subtitle-ds">
            Sesión activa con rol <StatusBadge status={usuario.rol} />. Los módulos visibles en tu
            menú lateral se adaptan a tus permisos.
          </p>
        </div>
      </header>

      <section className="section-block-ds">
        <div className="section-header-ds">
          <div>
            <h2 className="section-title-ds">Módulos habilitados</h2>
            <p className="section-subtitle-ds">
              Selecciona un módulo para operar en Chuno Banca.
            </p>
          </div>
        </div>

        <div className="modules-grid-ds">
          {navItems.map((item) => {
            const Icon = item.icon
            const label = item.getLabel(usuario.rol)

            return (
              <div
                key={item.id}
                className="module-card-ds"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
              >
                <div className="module-card-header">
                  <div className="module-card-icon">
                    <Icon size={24} />
                  </div>
                  <ArrowRight size={18} className="module-card-arrow" />
                </div>
                <h3 className="module-card-title">{label}</h3>
                <p className="module-card-desc">{item.description}</p>
                <div className="module-card-footer">
                  <span className="module-action-link">Acceder al módulo &rarr;</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
