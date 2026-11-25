import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import type { CuotaPlan } from '../prestamos.api'

export function PlanCuotasTable({ cuotas }: { cuotas: CuotaPlan[] }) {
  return (
    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N°</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Capital</TableHead>
            <TableHead className="text-right">Interés</TableHead>
            <TableHead className="text-right">Cuota</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cuotas.map((cuota) => (
            <TableRow key={cuota.numero}>
              <TableCell>{cuota.numero}</TableCell>
              <TableCell>{formatDate(cuota.fechaVencimiento)}</TableCell>
              <TableCell className="text-right">{formatCurrency(cuota.capital)}</TableCell>
              <TableCell className="text-right">{formatCurrency(cuota.interes)}</TableCell>
              <TableCell className="text-right">
                <strong>{formatCurrency(cuota.cuota)}</strong>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(cuota.saldo)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
