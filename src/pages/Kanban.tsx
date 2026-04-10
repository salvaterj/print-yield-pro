import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { kanbanColumns } from '@/data/mockData';
import { ProductionStatus, ServiceOrder } from '@/types';
import { generateOSPDF } from '@/lib/pdfGenerator';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { 
  AlertTriangle, 
  GripVertical, 
  Printer, 
  CheckCircle2, 
  ExternalLink,
  Package,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function Kanban() {
  const navigate = useNavigate();
  const { serviceOrders, clients, rawMaterials, updateServiceOrder, updateServiceOrderStatus, currentProfile } = useApp();
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [observation, setObservation] = useState('');
  const today = startOfDay(new Date());

  const handleMoveOS = (osId: string, newStatus: ProductionStatus) => {
    const os = serviceOrders.find(o => o.id === osId);
    if (!os) return;

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
    
    if (selectedOS?.id === osId) {
      setSelectedOS({ ...os, status_producao: newStatus });
    }
  };

  const handleCardClick = (os: ServiceOrder) => {
    setSelectedOS(os);
    setObservation('');
    setIsDrawerOpen(true);
  };

  const handlePrintOS = () => {
    if (!selectedOS) return;
    const client = clients.find(c => c.id === selectedOS.cliente_id);
    generateOSPDF(selectedOS, client, undefined, undefined);
  };

  const handleQualidadeOK = () => {
    if (!selectedOS) return;
    updateServiceOrder(selectedOS.id, { 
      qualidade_ok: true,
      logs: [
        ...selectedOS.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          usuario: 'Qualidade',
          acao: 'Qualidade OK',
          detalhes: 'Pedido aprovado pelo controle de qualidade',
        }
      ]
    });
    setSelectedOS({ ...selectedOS, qualidade_ok: true });
    toast.success('Qualidade marcada como OK!');
  };

  const handleAddObservation = () => {
    if (!selectedOS || !observation.trim()) return;
    
    updateServiceOrder(selectedOS.id, { 
      observacoes_producao: selectedOS.observacoes_producao 
        ? `${selectedOS.observacoes_producao}\n\n[${format(new Date(), 'dd/MM HH:mm')}] ${observation}`
        : `[${format(new Date(), 'dd/MM HH:mm')}] ${observation}`,
      logs: [
        ...selectedOS.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          usuario: 'Usuário',
          acao: 'Observação adicionada',
          detalhes: observation,
        }
      ]
    });
    
    toast.success('Observação adicionada!');
    setObservation('');
  };

  const handleAdvanceStage = () => {
    if (!selectedOS) return;
    
    const currentIndex = kanbanColumns.findIndex(c => c.id === selectedOS.status_producao);
    const nextStatus = kanbanColumns[currentIndex + 1]?.id as ProductionStatus;
    
    if (nextStatus) {
      handleMoveOS(selectedOS.id, nextStatus);
    }
  };

  const getOSByStatus = (status: ProductionStatus) => 
    serviceOrders.filter(os => os.status_producao === status);

  const client = selectedOS ? clients.find(c => c.id === selectedOS.cliente_id) : null;
  const bobina = selectedOS?.bobina_reservada_id ? rawMaterials.find(b => b.id === selectedOS.bobina_reservada_id) : null;
  const currentColumnIndex = selectedOS ? kanbanColumns.findIndex(c => c.id === selectedOS.status_producao) : -1;
  const nextColumn = currentColumnIndex >= 0 ? kanbanColumns[currentColumnIndex + 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kanban - Produção</h1>
        <p className="text-muted-foreground">Clique em um card para ver detalhes e ações rápidas</p>
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
                    const osClient = clients.find(c => c.id === os.cliente_id);
                    const isOverdue = isBefore(parseISO(os.prazo_saida_ate), today) && 
                      os.status_producao !== 'entregue' && os.status_producao !== 'nf_emitida';
                    const colIndex = kanbanColumns.findIndex(c => c.id === column.id);
                    const nextStatus = kanbanColumns[colIndex + 1]?.id;

                    return (
                      <Card 
                        key={os.id} 
                        className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? 'border-status-error bg-status-error/5' : ''}`}
                        onClick={() => handleCardClick(os)}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {isOverdue && <AlertTriangle className="h-4 w-4 text-status-error flex-shrink-0" />}
                              <span className="font-medium text-sm truncate">{os.numero_os}</span>
                              {os.qualidade_ok && (
                                <CheckCircle2 className="h-3 w-3 text-status-success flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{osClient?.trade_name}</p>
                            <p className="text-xs truncate">{os.nome_pedido}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs ${isOverdue ? 'text-status-error font-medium' : 'text-muted-foreground'}`}>
                                Prazo: {format(parseISO(os.prazo_saida_ate), 'dd/MM')}
                              </span>
                              {nextStatus && column.id !== 'entregue' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 text-xs px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveOS(os.id, nextStatus);
                                  }}
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

      {/* OS Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selectedOS && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedOS.numero_os}
                  <Badge variant="outline" style={{ 
                    borderColor: `hsl(var(--${kanbanColumns.find(c => c.id === selectedOS.status_producao)?.color}))`,
                    color: `hsl(var(--${kanbanColumns.find(c => c.id === selectedOS.status_producao)?.color}))` 
                  }}>
                    {kanbanColumns.find(c => c.id === selectedOS.status_producao)?.title}
                  </Badge>
                  {selectedOS.qualidade_ok && (
                    <Badge className="bg-status-success/20 text-status-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      QOK
                    </Badge>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{client?.trade_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pedido</p>
                    <p className="font-medium">{selectedOS.nome_pedido}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Prazo</p>
                      <p className={`font-medium ${isBefore(parseISO(selectedOS.prazo_saida_ate), today) ? 'text-status-error' : ''}`}>
                        {format(parseISO(selectedOS.prazo_saida_ate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Qtd Rolos</p>
                      <p className="font-medium">{selectedOS.quantidade_rolos}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {bobina && (
                  <>
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bobina Vinculada</p>
                        <p className="font-medium">{bobina.nome}</p>
                        <p className="text-xs text-muted-foreground">Saldo: {bobina.saldo_m}m</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {selectedOS.yield_snapshot && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Aproveitamento</p>
                      <div className="grid grid-cols-3 gap-2 text-sm bg-muted/30 p-3 rounded-lg">
                        <div>
                          <span className="text-muted-foreground">Pistas</span>
                          <p className="font-bold text-primary">{selectedOS.yield_snapshot.pistas}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Eficiência</span>
                          <p className="font-bold">{selectedOS.yield_snapshot.eficiencia_percent.toFixed(1)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Custo MP</span>
                          <p className="font-bold">R$ {selectedOS.yield_snapshot.custo_estimado.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium">Ações Rápidas</p>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate(`/os/${selectedOS.id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Detalhe Completo
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handlePrintOS}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>

                  {!selectedOS.qualidade_ok && selectedOS.status_producao === 'qualidade' && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleQualidadeOK}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar Qualidade OK
                    </Button>
                  )}

                  {nextColumn && selectedOS.status_producao !== 'entregue' && (
                    <Button 
                      className="w-full justify-start"
                      onClick={handleAdvanceStage}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Avançar para: {nextColumn.title}
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Adicionar Observação
                  </p>
                  <Textarea 
                    placeholder="Digite uma observação..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleAddObservation}
                    disabled={!observation.trim()}
                  >
                    Salvar Observação
                  </Button>
                </div>

                {selectedOS.observacoes_producao && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Observações</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                        {selectedOS.observacoes_producao}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
