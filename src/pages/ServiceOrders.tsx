import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { WorkOrder, WorkOrderItem, WorkOrderStatus, WorkflowStage } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, ClipboardList, Eye } from 'lucide-react';
import { toast } from 'sonner';

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

const emptyWorkOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'> = {
  os_number: '',
  quote_id: null,
  company_id: '',
  salesperson_id: null,
  carrier_id: null,
  status: 'pending',
  workflow_stage: 'a_fazer',
  issue_date: new Date().toISOString().slice(0, 10),
  deadline: new Date().toISOString().slice(0, 10),
  production_notes: '',
  internal_notes: '',
};

const emptyWorkOrderItem: Omit<WorkOrderItem, 'id' | 'created_at' | 'updated_at'> = {
  work_order_id: '',
  finished_product_id: null,
  raw_product_id: null,
  description: '',
  quantity: 0,
  width_mm: 0,
  height_mm: 0,
  units_per_row: 0,
  units_per_meter: 0,
  material_used_meters: 0,
  waste_meters: 0,
  setup_notes: '',
  technical_notes: '',
};

export default function ServiceOrders() {
  const {
    companies,
    carriers,
    salespeople,
    finishedProducts,
    rawProducts,
    quotes,
    workOrders,
    workOrderItems,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    addWorkOrderItem,
    updateWorkOrderItem,
    deleteWorkOrderItem,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WorkOrderStatus>('all');
  const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState(emptyWorkOrder);

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkOrderItem | null>(null);
  const [itemFormData, setItemFormData] = useState(emptyWorkOrderItem);

  const companyOptions = useMemo(() => companies.filter((c) => c.active), [companies]);
  const carrierOptions = useMemo(() => carriers.filter((c) => c.active), [carriers]);
  const salespersonOptions = useMemo(() => salespeople.filter((s) => s.active), [salespeople]);
  const quoteOptions = useMemo(() => quotes, [quotes]);
  const finishedProductOptions = useMemo(() => finishedProducts.filter((fp) => fp.active), [finishedProducts]);
  const rawProductOptions = useMemo(() => rawProducts.filter((rp) => rp.active), [rawProducts]);

  const getCompanyLabel = (id: string) => {
    const c = companies.find((x) => x.id === id);
    if (!c) return '';
    return c.code ? `${c.code} - ${c.trade_name}` : c.trade_name;
  };

  const getCarrierLabel = (id: string | null) => {
    if (!id) return '-';
    const c = carriers.find((x) => x.id === id);
    if (!c) return '-';
    return c.code ? `${c.code} - ${c.name}` : c.name;
  };

  const getSalespersonLabel = (id: string | null) => {
    if (!id) return '-';
    const s = salespeople.find((x) => x.id === id);
    if (!s) return '-';
    return s.code ? `${s.code} - ${s.name}` : s.name;
  };

  const getQuoteLabel = (id: string | null) => {
    if (!id) return '-';
    const q = quotes.find((x) => x.id === id);
    return q ? q.quote_number : '-';
  };

  const getStatusLabel = (status: WorkOrderStatus) => statusOptions.find((o) => o.value === status)?.label || status;
  const getStageLabel = (stage: WorkflowStage) => stageOptions.find((o) => o.value === stage)?.label || stage;

  const orderItemsCount = (workOrderId: string) => workOrderItems.filter((it) => it.work_order_id === workOrderId).length;

  const filtered = workOrders.filter((wo) => {
    const company = companies.find((c) => c.id === wo.company_id);
    const matchesSearch =
      (wo.os_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (company?.trade_name?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || wo.company_id === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const handleOpenDialog = (order?: WorkOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        os_number: order.os_number,
        quote_id: order.quote_id,
        company_id: order.company_id,
        salesperson_id: order.salesperson_id,
        carrier_id: order.carrier_id,
        status: order.status,
        workflow_stage: order.workflow_stage,
        issue_date: order.issue_date,
        deadline: order.deadline,
        production_notes: order.production_notes,
        internal_notes: order.internal_notes,
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setEditingOrder(null);
      setFormData({ ...emptyWorkOrder, issue_date: today, deadline: today });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.company_id) {
      toast.error('Selecione o cliente');
      return;
    }

    try {
      if (editingOrder) {
        await updateWorkOrder(editingOrder.id, formData);
        toast.success('OS atualizada!');
        setIsDialogOpen(false);
        return;
      }

      const osNumber = formData.os_number?.trim() || `OS-${Date.now()}`;
      const created = await addWorkOrder({ ...formData, os_number: osNumber });
      setEditingOrder(created);
      toast.success('OS criada! Agora adicione os itens.');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar OS');
    }
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    try {
      await deleteWorkOrder(deletingOrder.id);
      toast.success('OS excluída!');
      setIsDeleteDialogOpen(false);
      setDeletingOrder(null);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao excluir OS');
    }
  };

  const itemsForEditing = editingOrder ? workOrderItems.filter((it) => it.work_order_id === editingOrder.id) : [];

  const handleOpenItemDialog = (item?: WorkOrderItem) => {
    if (!editingOrder) {
      toast.error('Salve a OS antes de adicionar itens');
      return;
    }

    if (item) {
      setEditingItem(item);
      setItemFormData({
        work_order_id: item.work_order_id,
        finished_product_id: item.finished_product_id,
        raw_product_id: item.raw_product_id,
        description: item.description || '',
        quantity: item.quantity || 0,
        width_mm: item.width_mm || 0,
        height_mm: item.height_mm || 0,
        units_per_row: item.units_per_row || 0,
        units_per_meter: item.units_per_meter || 0,
        material_used_meters: item.material_used_meters || 0,
        waste_meters: item.waste_meters || 0,
        setup_notes: item.setup_notes || '',
        technical_notes: item.technical_notes || '',
      });
    } else {
      setEditingItem(null);
      setItemFormData({ ...emptyWorkOrderItem, work_order_id: editingOrder.id });
    }
    setIsItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!editingOrder) return;

    try {
      if (editingItem) {
        await updateWorkOrderItem(editingItem.id, itemFormData);
        toast.success('Item atualizado!');
      } else {
        await addWorkOrderItem(itemFormData);
        toast.success('Item adicionado!');
      }
      setIsItemDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteWorkOrderItem(id);
      toast.success('Item removido!');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao remover item');
    }
  };

  const badgeVariant = (status: WorkOrderStatus) => {
    if (status === 'finished') return 'default';
    if (status === 'canceled') return 'secondary';
    if (status === 'in_production') return 'outline';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Ordens de Serviço
          </h1>
          <p className="text-muted-foreground">Crie e acompanhe OS</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova OS
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-[220px]">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[260px]">
              <Select value={companyFilter} onValueChange={(v) => setCompanyFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {companyOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {getCompanyLabel(c.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} OS</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma OS encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((wo) => {
                  const company = companies.find((c) => c.id === wo.company_id);
                  return (
                    <TableRow key={wo.id}>
                      <TableCell className="font-medium">{wo.os_number}</TableCell>
                      <TableCell>{company?.trade_name}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(wo.status)}>{getStatusLabel(wo.status)}</Badge>
                      </TableCell>
                      <TableCell>{getStageLabel(wo.workflow_stage)}</TableCell>
                      <TableCell>{wo.deadline}</TableCell>
                      <TableCell className="text-right">{orderItemsCount(wo.id)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link to={`/os/${wo.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(wo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingOrder(wo);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Editar OS' : 'Nova OS'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="os_number">Número da OS</Label>
                <Input id="os_number" value={formData.os_number} onChange={(e) => setFormData({ ...formData, os_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as WorkOrderStatus })}>
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
                <Label>Cliente *</Label>
                <Select value={formData.company_id || 'none'} onValueChange={(v) => setFormData({ ...formData, company_id: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione...</SelectItem>
                    {companyOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getCompanyLabel(c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Etapa (Kanban)</Label>
                <Select value={formData.workflow_stage} onValueChange={(v) => setFormData({ ...formData, workflow_stage: v as WorkflowStage })}>
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
              <div className="space-y-2">
                <Label>Orçamento de origem</Label>
                <Select value={formData.quote_id || 'none'} onValueChange={(v) => setFormData({ ...formData, quote_id: v === 'none' ? null : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {quoteOptions.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.quote_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_date">Data de emissão</Label>
                <Input id="issue_date" type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Prazo</Label>
                <Input id="deadline" type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={formData.salesperson_id || 'none'} onValueChange={(v) => setFormData({ ...formData, salesperson_id: v === 'none' ? null : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {salespersonOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {getSalespersonLabel(s.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transportadora</Label>
                <Select value={formData.carrier_id || 'none'} onValueChange={(v) => setFormData({ ...formData, carrier_id: v === 'none' ? null : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {carrierOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getCarrierLabel(c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="production_notes">Observações de produção</Label>
                <Textarea
                  id="production_notes"
                  value={formData.production_notes}
                  onChange={(e) => setFormData({ ...formData, production_notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internal_notes">Observações internas</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {editingOrder && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Itens da OS</p>
                    <p className="text-sm text-muted-foreground">Campos técnicos permanecem persistidos para histórico.</p>
                  </div>
                  <Button onClick={() => handleOpenItemDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar item
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Bobina</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsForEditing.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Nenhum item adicionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      itemsForEditing.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell>{it.finished_product_id ? finishedProducts.find((x) => x.id === it.finished_product_id)?.name : '-'}</TableCell>
                          <TableCell>{it.raw_product_id ? rawProducts.find((x) => x.id === it.raw_product_id)?.name : '-'}</TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenItemDialog(it)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(it.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingOrder ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar item' : 'Novo item'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto acabado</Label>
                <Select
                  value={itemFormData.finished_product_id || 'none'}
                  onValueChange={(v) => setItemFormData({ ...itemFormData, finished_product_id: v === 'none' ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {finishedProductOptions.map((fp) => (
                      <SelectItem key={fp.id} value={fp.id}>
                        {fp.code ? `${fp.code} - ${fp.name}` : fp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bobina / matéria-prima</Label>
                <Select value={itemFormData.raw_product_id || 'none'} onValueChange={(v) => setItemFormData({ ...itemFormData, raw_product_id: v === 'none' ? null : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {rawProductOptions.map((rp) => (
                      <SelectItem key={rp.id} value={rp.id}>
                        {rp.code ? `${rp.code} - ${rp.name}` : rp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" value={itemFormData.description} onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" type="number" step="1" value={itemFormData.quantity} onChange={(e) => setItemFormData({ ...itemFormData, quantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width_mm">Largura (mm)</Label>
                <Input id="width_mm" type="number" step="0.01" value={itemFormData.width_mm} onChange={(e) => setItemFormData({ ...itemFormData, width_mm: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_mm">Altura (mm)</Label>
                <Input id="height_mm" type="number" step="0.01" value={itemFormData.height_mm} onChange={(e) => setItemFormData({ ...itemFormData, height_mm: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units_per_row">Qtd por carreira</Label>
                <Input id="units_per_row" type="number" step="1" value={itemFormData.units_per_row} onChange={(e) => setItemFormData({ ...itemFormData, units_per_row: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units_per_meter">Qtd por metro</Label>
                <Input id="units_per_meter" type="number" step="0.01" value={itemFormData.units_per_meter} onChange={(e) => setItemFormData({ ...itemFormData, units_per_meter: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material_used_meters">Consumo (m)</Label>
                <Input id="material_used_meters" type="number" step="0.01" value={itemFormData.material_used_meters} onChange={(e) => setItemFormData({ ...itemFormData, material_used_meters: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waste_meters">Perda (m)</Label>
                <Input id="waste_meters" type="number" step="0.01" value={itemFormData.waste_meters} onChange={(e) => setItemFormData({ ...itemFormData, waste_meters: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="setup_notes">Instruções de setup</Label>
                <Textarea id="setup_notes" value={itemFormData.setup_notes} onChange={(e) => setItemFormData({ ...itemFormData, setup_notes: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technical_notes">Observações técnicas</Label>
                <Textarea id="technical_notes" value={itemFormData.technical_notes} onChange={(e) => setItemFormData({ ...itemFormData, technical_notes: e.target.value })} rows={3} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem}>{editingItem ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a OS "{deletingOrder?.os_number}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
