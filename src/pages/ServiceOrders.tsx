import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { kanbanColumns } from '@/data/mockData';
import { Link } from 'react-router-dom';

export default function ServiceOrders() {
  const { serviceOrders, clients } = useApp();
  const today = startOfDay(new Date());

  const isOverdue = (os: typeof serviceOrders[0]) => 
    isBefore(parseISO(os.prazo_saida_ate), today) && 
    os.status_producao !== 'entregue' && 
    os.status_producao !== 'nf_emitida';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Ordens de Serviço
        </h1>
        <p className="text-muted-foreground">Lista de todas as OS</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceOrders.map((os) => {
                const client = clients.find(c => c.id === os.cliente_id);
                const column = kanbanColumns.find(c => c.id === os.status_producao);
                const overdue = isOverdue(os);
                return (
                  <TableRow key={os.id} className={overdue ? 'bg-status-error/5' : ''}>
                    <TableCell className="font-medium">
                      <Link to={`/os/${os.id}`} className="hover:underline flex items-center gap-2">
                        {overdue && <AlertTriangle className="h-4 w-4 text-status-error" />}
                        {os.numero_os}
                      </Link>
                    </TableCell>
                    <TableCell>{client?.nome_fantasia}</TableCell>
                    <TableCell>{os.nome_pedido}</TableCell>
                    <TableCell>{format(parseISO(os.data_entrada), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className={overdue ? 'text-status-error font-medium' : ''}>
                      {format(parseISO(os.prazo_saida_ate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{column?.title}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
