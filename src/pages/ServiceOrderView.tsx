import { Link, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { WorkOrderStatus, WorkflowStage } from '@/types';

const statusOptions: Array<{ value: WorkOrderStatus; label: string }> = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_production', label: 'Em produção' },
  { value: 'finished', label: 'Finalizada' },
  { value: 'canceled', label: 'Cancelada' },
];

const stageOptions: Array<{ value: WorkflowStage; label: string }> = [
  { value: 'a_fazer', label: 'A Fazer' },
  { value: 'preparacao', label: 'Preparação' },
  { value: 'impressao', label: 'Impressão' },
  { value: 'rebobinagem_corte', label: 'Rebobinagem/Corte' },
  { value: 'acabamento', label: 'Acabamento' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'pronto_para_nf', label: 'Pronto p/ NF' },
  { value: 'nf_emitida', label: 'NF Emitida' },
  { value: 'entregue', label: 'Entregue' },
];

export default function ServiceOrderView() {
  const { id } = useParams();
  const {
    companies,
    carriers,
    salespeople,
    finishedProducts,
    rawProducts,
    workOrders,
    workOrderItems,
    updateWorkOrder,
  } = useApp();

  const os = useMemo(() => workOrders.find((w) => w.id === id), [workOrders, id]);
  const items = useMemo(() => workOrderItems.filter((it) => it.work_order_id === id), [workOrderItems, id]);

  const company = useMemo(() => companies.find((c) => c.id === os?.company_id), [companies, os?.company_id]);
  const carrier = useMemo(() => carriers.find((c) => c.id === os?.carrier_id), [carriers, os?.carrier_id]);
  const salesperson = useMemo(() => salespeople.find((s) => s.id === os?.salesperson_id), [salespeople, os?.salesperson_id]);

  const getStatusLabel = (value: WorkOrderStatus) => statusOptions.find((o) => o.value === value)?.label || value;
  const getStageLabel = (value: WorkflowStage) => stageOptions.find((o) => o.value === value)?.label || value;

  if (!os) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link to="/os">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">OS não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/os">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              {os.os_number}
            </h1>
            <p className="text-sm text-muted-foreground">Cliente: {company?.trade_name}</p>
          </div>
          <Badge variant="outline">{getStatusLabel(os.status)}</Badge>
          <Badge variant="secondary">{getStageLabel(os.workflow_stage)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">{company?.name || '-'}</p>
            <p className="text-sm text-muted-foreground">CNPJ</p>
            <p className="font-medium">{company?.cnpj || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Emissão</p>
            <p className="font-medium">{os.issue_date}</p>
            <p className="text-sm text-muted-foreground">Prazo</p>
            <p className="font-medium">{os.deadline}</p>
            <p className="text-sm text-muted-foreground">Vendedor</p>
            <p className="font-medium">{salesperson?.name || '-'}</p>
            <p className="text-sm text-muted-foreground">Transportadora</p>
            <p className="font-medium">{carrier?.name || '-'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={os.status} onValueChange={(v) => updateWorkOrder(os.id, { status: v as WorkOrderStatus, updated_at: new Date().toISOString() })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etapa (Kanban)</Label>
              <Select
                value={os.workflow_stage}
                onValueChange={(v) => updateWorkOrder(os.id, { workflow_stage: v as WorkflowStage, updated_at: new Date().toISOString() })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Observações de produção</p>
              <p className="font-medium whitespace-pre-line">{os.production_notes || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Observações internas</p>
              <p className="font-medium whitespace-pre-line">{os.internal_notes || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Itens</p>
              <p className="text-sm text-muted-foreground">{items.length} item(ns)</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Bobina</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Largura</TableHead>
                <TableHead className="text-right">Altura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum item na OS
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it) => {
                  const fp = it.finished_product_id ? finishedProducts.find((x) => x.id === it.finished_product_id) : null;
                  const rp = it.raw_product_id ? rawProducts.find((x) => x.id === it.raw_product_id) : null;
                  return (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{fp ? fp.name : '-'}</TableCell>
                      <TableCell>{rp ? rp.name : '-'}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">{it.width_mm}</TableCell>
                      <TableCell className="text-right">{it.height_mm}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

