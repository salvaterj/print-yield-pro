import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { YieldCalculator } from '@/components/YieldCalculator';
import { generateOSPDF } from '@/lib/pdfGenerator';
import { kanbanColumns } from '@/data/mockData';
import { YieldSnapshot, ProductionStatus } from '@/types';
import { toast } from 'sonner';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { 
  ArrowLeft,
  ClipboardList,
  Printer,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  Palette,
  Package,
  FileText,
  Clock,
  Save
} from 'lucide-react';

export default function ServiceOrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { serviceOrders, clients, rawMaterials, finishedProducts, updateServiceOrder, updateServiceOrderStatus, currentProfile } = useApp();
  const [localBobinaId, setLocalBobinaId] = useState<string | undefined>();

  const os = serviceOrders.find(o => o.id === id);
  const client = clients.find(c => c.id === os?.cliente_id);
  const column = kanbanColumns.find(c => c.id === os?.status_producao);

  const today = startOfDay(new Date());
  const isOverdue = os && isBefore(parseISO(os.prazo_saida_ate), today) && 
    os.status_producao !== 'entregue' && os.status_producao !== 'nf_emitida';

  if (!os) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Ordem de Serviço não encontrada</p>
        <Button variant="outline" onClick={() => navigate('/os')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    generateOSPDF(os, client);
  };

  const handleSaveYieldSnapshot = (snapshot: YieldSnapshot) => {
    updateServiceOrder(os.id, {
      bobina_reservada_id: snapshot.bobina_id,
      yield_snapshot: snapshot,
      logs: [
        ...os.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          usuario: 'Usuário',
          acao: 'Aproveitamento calculado',
          detalhes: `Bobina: ${snapshot.bobina_nome}, ${snapshot.pistas} pistas, ${snapshot.eficiencia_percent.toFixed(1)}% eficiência`,
        }
      ]
    });
    toast.success('Snapshot de aproveitamento salvo!');
  };

  const handleQualidadeOK = () => {
    updateServiceOrder(os.id, { 
      qualidade_ok: true,
      logs: [
        ...os.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          usuario: 'Qualidade',
          acao: 'Qualidade OK',
          detalhes: 'Pedido aprovado pelo controle de qualidade',
        }
      ]
    });
    toast.success('Qualidade marcada como OK!');
  };

  const handleAdvanceStage = () => {
    const currentIndex = kanbanColumns.findIndex(c => c.id === os.status_producao);
    const nextStatus = kanbanColumns[currentIndex + 1]?.id as ProductionStatus;
    
    if (!nextStatus) {
      toast.error('OS já está na última etapa');
      return;
    }

    if (nextStatus === 'pronto_para_nf' && !os.qualidade_ok) {
      toast.error('A OS precisa ter Qualidade OK para ir para Pronto p/ NF');
      return;
    }

    if (nextStatus === 'nf_emitida' && currentProfile !== 'fiscal' && currentProfile !== 'admin') {
      toast.error('Apenas o perfil Fiscal pode emitir NF');
      return;
    }

    updateServiceOrderStatus(os.id, nextStatus, 'Usuário');
    toast.success(`OS avançada para: ${kanbanColumns[currentIndex + 1]?.title}`);
  };

  // Find a product that matches for yield calculation
  const matchingProduct = finishedProducts.find(p => 
    os.medida_material_mm?.includes(String(p.largura_mm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/os')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {isOverdue && <AlertTriangle className="h-6 w-6 text-status-error" />}
                <ClipboardList className="h-6 w-6" />
                {os.numero_os}
              </h1>
              <Badge variant="outline" style={{ 
                borderColor: `hsl(var(--${column?.color}))`,
                color: `hsl(var(--${column?.color}))` 
              }}>
                {column?.title}
              </Badge>
              {os.qualidade_ok && (
                <Badge className="bg-status-success/20 text-status-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Qualidade OK
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{client?.nome_fantasia} - {os.nome_pedido}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          {!os.qualidade_ok && os.status_producao === 'qualidade' && (
            <Button variant="outline" onClick={handleQualidadeOK}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar Qualidade OK
            </Button>
          )}
          {os.status_producao !== 'entregue' && (
            <Button onClick={handleAdvanceStage}>
              Avançar Etapa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <Card className="border-status-error bg-status-error/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-status-error">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">OS em Atraso!</p>
                <p className="text-sm">Prazo: {format(parseISO(os.prazo_saida_ate), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Info do Pedido</TabsTrigger>
          <TabsTrigger value="pedido">Pedido</TabsTrigger>
          <TabsTrigger value="cores">Cores & Anilox</TabsTrigger>
          <TabsTrigger value="quantidade">Quantidade</TabsTrigger>
          <TabsTrigger value="bobina">Bobina & Aproveitamento</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Info do Pedido */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendedor</p>
                    <p className="font-medium">{os.vendedor_nome || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{client?.nome_fantasia || '-'}</p>
                    <p className="text-sm text-muted-foreground">{client?.cnpj}</p>
                  </div>
                </div>
                {os.impressor_nome && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Impressor</p>
                      <p className="font-medium">{os.impressor_nome}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Entrada</p>
                    <p className="font-medium">{format(parseISO(os.data_entrada), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo (Saída Até)</p>
                    <p className={`font-medium ${isOverdue ? 'text-status-error' : ''}`}>
                      {format(parseISO(os.prazo_saida_ate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                {os.data_saida && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-status-success mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Saída</p>
                      <p className="font-medium text-status-success">
                        {format(parseISO(os.data_saida), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pedido */}
        <TabsContent value="pedido">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">Nome do Pedido</p>
                <p className="font-medium text-lg">{os.nome_pedido}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Jogo/Faca 01</p>
                  <p className="font-medium capitalize">{os.faca_01 || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jogo/Faca 02</p>
                  <p className="font-medium capitalize">{os.faca_02 || '-'}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Medida do Material</p>
                  <p className="font-medium">{os.medida_material_mm || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Material</p>
                  <p className="font-medium">{os.material || '-'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Amostra</p>
                <p className="font-medium">{os.amostra || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Utilizar Caixa</p>
                <div className="flex gap-4">
                  <Badge variant={os.usar_caixa === '107' ? 'default' : 'outline'}>
                    {os.usar_caixa === '107' ? '✓' : '○'} 107
                  </Badge>
                  <Badge variant={os.usar_caixa === 'MX5500' ? 'default' : 'outline'}>
                    {os.usar_caixa === 'MX5500' ? '✓' : '○'} MX5500
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cores & Anilox */}
        <TabsContent value="cores">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Cores / Pantones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">PANT 01</p>
                    <p className="font-medium">{os.pantone_01 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PANT 02</p>
                    <p className="font-medium">{os.pantone_02 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PANT 03</p>
                    <p className="font-medium">{os.pantone_03 || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anilox</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Anilox 01</p>
                    <p className="font-medium">{os.anilox_01 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Anilox 02</p>
                    <p className="font-medium">{os.anilox_02 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Anilox 03</p>
                    <p className="font-medium">{os.anilox_03 || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chapado</p>
                  <Badge variant={os.chapado ? 'default' : 'outline'}>
                    {os.chapado ? 'SIM' : 'NÃO'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quantidade */}
        <TabsContent value="quantidade">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quantidade do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Impressão</p>
                  <p className="text-2xl font-bold">{os.impressao_m}</p>
                  <p className="text-sm text-muted-foreground">metros</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Rebobinagem</p>
                  <p className="text-2xl font-bold">{os.rebobinagem_m}</p>
                  <p className="text-sm text-muted-foreground">metros</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Qtd Rolos</p>
                  <p className="text-2xl font-bold">{os.quantidade_rolos}</p>
                  <p className="text-sm text-muted-foreground">rolos</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Qtd Caixas</p>
                  <p className="text-2xl font-bold">{os.quantidade_caixa}</p>
                  <p className="text-sm text-muted-foreground">caixas</p>
                </div>
              </div>

              {os.etiqueta_qtd && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Quantidade de Etiquetas</p>
                  <p className="text-2xl font-bold">{os.etiqueta_qtd}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bobina & Aproveitamento */}
        <TabsContent value="bobina">
          <div className="space-y-6">
            {/* Existing Snapshot */}
            {os.yield_snapshot && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-status-success" />
                    Aproveitamento Salvo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <YieldCalculator
                    bobinas={rawMaterials}
                    produtos={finishedProducts}
                    selectedBobinaId={os.bobina_reservada_id}
                    selectedProdutoId={matchingProduct?.id}
                    quantidadeRolos={os.quantidade_rolos}
                    existingSnapshot={os.yield_snapshot}
                    readOnly
                  />
                </CardContent>
              </Card>
            )}

            {/* Recalculate */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {os.yield_snapshot ? 'Recalcular Aproveitamento' : 'Calcular Aproveitamento'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <YieldCalculator
                  bobinas={rawMaterials}
                  produtos={finishedProducts}
                  selectedBobinaId={localBobinaId || os.bobina_reservada_id}
                  selectedProdutoId={matchingProduct?.id}
                  quantidadeRolos={os.quantidade_rolos}
                  onBobinaChange={setLocalBobinaId}
                  onYieldCalculated={(snapshot) => {
                    // Don't auto-save, just update local state
                  }}
                />
                
                {localBobinaId && (
                  <Button 
                    onClick={() => {
                      const bobina = rawMaterials.find(b => b.id === localBobinaId);
                      if (!bobina || !matchingProduct) return;
                      
                      const { calculateYield } = require('@/components/YieldCalculator');
                      const result = calculateYield(bobina, matchingProduct, os.quantidade_rolos, 2, 3);
                      
                      if (result.pistas > 0) {
                        const snapshot: YieldSnapshot = {
                          ...result,
                          largura_bobina_mm: bobina.largura_mm,
                          largura_produto_mm: matchingProduct.largura_mm,
                          metragem_por_rolo_m: matchingProduct.metragem_por_rolo_m,
                          quantidade_rolos: os.quantidade_rolos,
                          margem_corte_mm: 2,
                          perdas_percent: 3,
                          bobina_id: bobina.id,
                          bobina_nome: bobina.nome,
                          data_calculo: new Date().toISOString(),
                          usuario: 'Usuário',
                        };
                        handleSaveYieldSnapshot(snapshot);
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Snapshot do Cálculo
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {os.logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum registro no histórico</p>
                ) : (
                  os.logs.slice().reverse().map((log) => (
                    <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.acao}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(log.timestamp), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.detalhes}</p>
                        <p className="text-xs text-muted-foreground">por {log.usuario}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Observations */}
      {os.observacoes_producao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações de Produção</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{os.observacoes_producao}</p>
          </CardContent>
        </Card>
      )}

      {/* NF Info */}
      {os.numero_nf && (
        <Card className="border-status-success">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-status-success">
              <FileText className="h-5 w-5" />
              Nota Fiscal Emitida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Número NF</p>
                <p className="font-medium">{os.numero_nf}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data NF</p>
                <p className="font-medium">{os.data_nf ? format(parseISO(os.data_nf), 'dd/MM/yyyy') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor NF</p>
                <p className="font-medium">{os.valor_nf ? `R$ ${os.valor_nf.toFixed(2)}` : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
