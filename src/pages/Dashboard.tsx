import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Package, 
  FileText, 
  ClipboardList, 
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { kanbanColumns } from '@/data/mockData';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { serviceOrders, rawMaterials, quotes, clients } = useApp();
  
  const today = startOfDay(new Date());
  
  // Calculate stats
  const osEmAtraso = serviceOrders.filter(os => 
    isBefore(parseISO(os.prazo_saida_ate), today) && 
    os.status_producao !== 'entregue' && 
    os.status_producao !== 'nf_emitida'
  );
  
  const osPorEtapa = kanbanColumns.map(col => ({
    ...col,
    count: serviceOrders.filter(os => os.status_producao === col.id).length,
  }));
  
  const bobinasEstoqueBaixo = rawMaterials.filter(b => 
    b.saldo_m < b.comprimento_m * 0.3 && b.estoque_status !== 'consumida'
  );
  
  const orcamentosPendentes = quotes.filter(q => 
    q.status === 'enviado' || q.status === 'rascunho'
  );
  
  const osHoje = serviceOrders.filter(os => 
    os.prazo_saida_ate === format(today, 'yyyy-MM-dd') &&
    os.status_producao !== 'entregue'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema - {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={osEmAtraso.length > 0 ? 'border-status-error/50 bg-status-error/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OS em Atraso</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${osEmAtraso.length > 0 ? 'text-status-error' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${osEmAtraso.length > 0 ? 'text-status-error' : ''}`}>
              {osEmAtraso.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {osEmAtraso.length > 0 ? 'Requer atenção imediata' : 'Nenhuma OS atrasada'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bobinas Estoque Baixo</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${bobinasEstoqueBaixo.length > 0 ? 'text-status-warning' : ''}`}>
              {bobinasEstoqueBaixo.length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {rawMaterials.length} bobinas no estoque
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orcamentosPendentes.length}</div>
            <p className="text-xs text-muted-foreground">
              {quotes.filter(q => q.status === 'aprovado').length} aprovados este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {serviceOrders.length} OS no total
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* OS por Etapa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">OS por Etapa de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {osPorEtapa.map(col => (
              <Link to="/kanban" key={col.id}>
                <Badge 
                  variant="outline" 
                  className="h-8 px-3 cursor-pointer hover:bg-muted transition-colors"
                  style={{ 
                    borderColor: `hsl(var(--${col.color}))`,
                    color: `hsl(var(--${col.color}))` 
                  }}
                >
                  {col.title}: <span className="font-bold ml-1">{col.count}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* OS em Atraso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-status-error" />
              OS em Atraso
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/kanban">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {osEmAtraso.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <CheckCircle2 className="h-5 w-5 text-status-success" />
                <span>Nenhuma OS em atraso!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {osEmAtraso.slice(0, 5).map(os => {
                  const client = clients.find(c => c.id === os.cliente_id);
                  return (
                    <Link 
                      key={os.id} 
                      to={`/os/${os.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-status-error/30 bg-status-error/5 hover:bg-status-error/10 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{os.numero_os}</p>
                        <p className="text-sm text-muted-foreground">{client?.nome_fantasia}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          Prazo: {format(parseISO(os.prazo_saida_ate), 'dd/MM')}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* OS para Hoje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-status-warning" />
              Prazo Hoje
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/os">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {osHoje.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <CheckCircle2 className="h-5 w-5 text-status-success" />
                <span>Nenhuma OS com prazo para hoje!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {osHoje.map(os => {
                  const client = clients.find(c => c.id === os.cliente_id);
                  const column = kanbanColumns.find(c => c.id === os.status_producao);
                  return (
                    <Link 
                      key={os.id} 
                      to={`/os/${os.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{os.numero_os}</p>
                        <p className="text-sm text-muted-foreground">{client?.nome_fantasia} - {os.nome_pedido}</p>
                      </div>
                      <Badge variant="outline">{column?.title}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bobinas com Estoque Baixo */}
      {bobinasEstoqueBaixo.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-status-warning" />
              Bobinas com Estoque Baixo
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bobinas">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bobinasEstoqueBaixo.map(bobina => (
                <div 
                  key={bobina.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-status-warning/30 bg-status-warning/5"
                >
                  <div>
                    <p className="font-medium">{bobina.nome}</p>
                    <p className="text-sm text-muted-foreground">Lote: {bobina.lote}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-status-warning">{bobina.saldo_m}m</p>
                    <p className="text-xs text-muted-foreground">de {bobina.comprimento_m}m</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
