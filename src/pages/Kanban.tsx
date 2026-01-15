import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kanbanColumns } from '@/data/mockData';
import { ProductionStatus } from '@/types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { AlertTriangle, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function Kanban() {
  const { serviceOrders, clients, updateServiceOrderStatus, currentProfile } = useApp();
  const today = startOfDay(new Date());

  const handleMoveOS = (osId: string, newStatus: ProductionStatus) => {
    const os = serviceOrders.find(o => o.id === osId);
    if (!os) return;

    // Validation rules
    if (newStatus === 'pronto_para_nf' && !os.qualidade_ok) {
      toast.error('A OS precisa ter Qualidade OK para ir para Pronto p/ NF');
      return;
    }
    if (newStatus === 'nf_emitida' && currentProfile !== 'fiscal' && currentProfile !== 'admin') {
      toast.error('Apenas o perfil Fiscal pode emitir NF');
      return;
    }

    updateServiceOrderStatus(osId, newStatus, 'Usuário');
    toast.success('OS movida com sucesso!');
  };

  const getOSByStatus = (status: ProductionStatus) => 
    serviceOrders.filter(os => os.status_producao === status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kanban - Produção</h1>
        <p className="text-muted-foreground">Acompanhe o fluxo de produção</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {kanbanColumns.map((column) => {
          const columnOS = getOSByStatus(column.id);
          return (
            <div key={column.id} className="flex-shrink-0 w-72">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span style={{ color: `hsl(var(--${column.color}))` }}>{column.title}</span>
                    <Badge variant="secondary">{columnOS.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[400px]">
                  {columnOS.map((os) => {
                    const client = clients.find(c => c.id === os.cliente_id);
                    const isOverdue = isBefore(parseISO(os.prazo_saida_ate), today) && 
                      os.status_producao !== 'entregue' && os.status_producao !== 'nf_emitida';
                    const currentIndex = kanbanColumns.findIndex(c => c.id === column.id);
                    const nextStatus = kanbanColumns[currentIndex + 1]?.id;

                    return (
                      <Card 
                        key={os.id} 
                        className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? 'border-status-error bg-status-error/5' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {isOverdue && <AlertTriangle className="h-4 w-4 text-status-error flex-shrink-0" />}
                              <span className="font-medium text-sm truncate">{os.numero_os}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{client?.nome_fantasia}</p>
                            <p className="text-xs truncate">{os.nome_pedido}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                Prazo: {format(parseISO(os.prazo_saida_ate), 'dd/MM')}
                              </span>
                              {nextStatus && column.id !== 'entregue' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 text-xs px-2"
                                  onClick={() => handleMoveOS(os.id, nextStatus)}
                                >
                                  Avançar →
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
