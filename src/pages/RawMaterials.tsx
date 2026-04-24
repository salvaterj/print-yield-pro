import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { RawProduct } from '@/types';
import { formatBRL, formatMM } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

const emptyRawProduct: Omit<RawProduct, 'id' | 'created_at' | 'updated_at'> = {
  code: '',
  name: '',
  material_type: '',
  width_mm: 0,
  length_m: 0,
  thickness_microns: 0,
  usable_width_mm: 0,
  waste_percentage: 0,
  cost_per_meter: 0,
  ipi_percentage: 0,
  cost_total_no_ipi: 0,
  cost_total_with_ipi: 0,
  cost_per_m2_no_ipi: 0,
  cost_per_m2_with_ipi: 0,
  cost_per_kg: null,
  supplier_name: '',
  notes: '',
  active: true,
};

type LastCostEdited = 'total' | 'meter';

export default function RawMaterials() {
  const { rawProducts, addRawProduct, updateRawProduct, deleteRawProduct } = useApp();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RawProduct | null>(null);
  const [deletingItem, setDeletingItem] = useState<RawProduct | null>(null);
  const [formData, setFormData] = useState(emptyRawProduct);
  const [lastCostEdited, setLastCostEdited] = useState<LastCostEdited>('meter');
  const [costInputMode, setCostInputMode] = useState<LastCostEdited>('meter');

  const recalc = useMemo(() => {
    return (next: typeof formData, last: LastCostEdited) => {
      const usableWidthMm = Number(next.usable_width_mm) || 0;
      const usableWidthM = usableWidthMm / 1000;
      const lengthM = Number(next.length_m) || 0;
      const areaTotalM2 = usableWidthM > 0 && lengthM > 0 ? usableWidthM * lengthM : 0;
      const ipiPct = Number(next.ipi_percentage) || 0;
      const ipiFactor = 1 + (ipiPct / 100);

      let costTotalNoIpi = Number(next.cost_total_no_ipi) || 0;
      let costPerMeterNoIpi = Number(next.cost_per_meter) || 0;

      if (last === 'total') {
        costPerMeterNoIpi = lengthM > 0 ? costTotalNoIpi / lengthM : 0;
      } else {
        costTotalNoIpi = lengthM > 0 ? costPerMeterNoIpi * lengthM : 0;
      }

      const costPerM2NoIpi = areaTotalM2 > 0 ? costTotalNoIpi / areaTotalM2 : 0;
      const costTotalWithIpi = costTotalNoIpi * ipiFactor;
      const costPerM2WithIpi = costPerM2NoIpi * ipiFactor;

      return {
        ...next,
        cost_total_no_ipi: Number.isFinite(costTotalNoIpi) ? costTotalNoIpi : 0,
        cost_per_meter: Number.isFinite(costPerMeterNoIpi) ? costPerMeterNoIpi : 0,
        cost_per_m2_no_ipi: Number.isFinite(costPerM2NoIpi) ? costPerM2NoIpi : 0,
        cost_total_with_ipi: Number.isFinite(costTotalWithIpi) ? costTotalWithIpi : 0,
        cost_per_m2_with_ipi: Number.isFinite(costPerM2WithIpi) ? costPerM2WithIpi : 0,
      };
    };
  }, []);

  const filtered = rawProducts.filter((rp) =>
    (rp.code?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (rp.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (rp.material_type?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleOpenDialog = (item?: RawProduct) => {
    if (item) {
      setEditingItem(item);
      const inferredMode: LastCostEdited =
        (item.cost_total_no_ipi || 0) > 0 && (item.cost_per_meter || 0) === 0 ? 'total' : 'meter';
      setLastCostEdited(inferredMode);
      setCostInputMode(inferredMode);
      setFormData(recalc({
        code: item.code || '',
        name: item.name || '',
        material_type: item.material_type || '',
        width_mm: item.width_mm || 0,
        length_m: item.length_m || 0,
        thickness_microns: item.thickness_microns || 0,
        usable_width_mm: item.usable_width_mm || 0,
        waste_percentage: item.waste_percentage || 0,
        cost_per_meter: item.cost_per_meter || 0,
        ipi_percentage: item.ipi_percentage || 0,
        cost_total_no_ipi: item.cost_total_no_ipi || 0,
        cost_total_with_ipi: item.cost_total_with_ipi || 0,
        cost_per_m2_no_ipi: item.cost_per_m2_no_ipi || 0,
        cost_per_m2_with_ipi: item.cost_per_m2_with_ipi || 0,
        cost_per_kg: item.cost_per_kg ?? null,
        supplier_name: item.supplier_name || '',
        notes: item.notes || '',
        active: item.active ?? true,
      }, inferredMode));
    } else {
      setEditingItem(null);
      setLastCostEdited('meter');
      setCostInputMode('meter');
      setFormData(emptyRawProduct);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome da bobina/matéria-prima');
      return;
    }

    const toSave = recalc(formData, lastCostEdited);

    try {
      if (editingItem) {
        await updateRawProduct(editingItem.id, toSave);
        toast.success('Bobina atualizada com sucesso!');
      } else {
        await addRawProduct(toSave);
        toast.success('Bobina cadastrada com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar bobina');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteRawProduct(deletingItem.id);
      toast.success('Bobina excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao excluir bobina');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Bobinas
          </h1>
          <p className="text-muted-foreground">Cadastro de produtos brutos / matéria-prima</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Bobina
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, nome ou material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} item(ns)</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Largura (mm)</TableHead>
                <TableHead className="text-right">Custo/m (s/ IPI)</TableHead>
                <TableHead className="text-right">Custo/m² (c/ IPI)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma bobina encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rp) => (
                  <TableRow key={rp.id}>
                    <TableCell>{rp.code}</TableCell>
                    <TableCell className="font-medium">{rp.name}</TableCell>
                    <TableCell>{rp.material_type}</TableCell>
                    <TableCell className="text-right">{formatMM(rp.width_mm, 0)}</TableCell>
                    <TableCell className="text-right">{formatBRL(rp.cost_per_meter || 0, 6)}</TableCell>
                    <TableCell className="text-right">{formatBRL(rp.cost_per_m2_with_ipi || 0, 4)}</TableCell>
                    <TableCell>{rp.active ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(rp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingItem(rp);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Bobina' : 'Nova Bobina'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código interno</Label>
                <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material_type">Tipo de material</Label>
                <Input
                  id="material_type"
                  value={formData.material_type}
                  onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Fornecedor</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width_mm">Largura (mm)</Label>
                <Input
                  id="width_mm"
                  type="number"
                  step="0.01"
                  value={formData.width_mm}
                  onChange={(e) => setFormData({ ...formData, width_mm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length_m">Comprimento (m)</Label>
                <Input
                  id="length_m"
                  type="number"
                  step="0.01"
                  value={formData.length_m}
                  onChange={(e) => setFormData(recalc({ ...formData, length_m: Number(e.target.value) }, lastCostEdited))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thickness_microns">Espessura (microns)</Label>
                <Input
                  id="thickness_microns"
                  type="number"
                  step="0.01"
                  value={formData.thickness_microns}
                  onChange={(e) => setFormData({ ...formData, thickness_microns: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usable_width_mm">Largura útil (mm)</Label>
                <Input
                  id="usable_width_mm"
                  type="number"
                  step="0.01"
                  value={formData.usable_width_mm}
                  onChange={(e) => setFormData(recalc({ ...formData, usable_width_mm: Number(e.target.value) }, lastCostEdited))}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waste_percentage">Perda (%)</Label>
                <Input
                  id="waste_percentage"
                  type="number"
                  step="0.01"
                  value={formData.waste_percentage}
                  onChange={(e) => setFormData({ ...formData, waste_percentage: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_meter">Custo por metro sem IPI</Label>
                <Input
                  id="cost_per_meter"
                  type="number"
                  step="0.000001"
                  value={formData.cost_per_meter}
                  disabled={costInputMode !== 'meter'}
                  onChange={(e) => {
                    const next = recalc({ ...formData, cost_per_meter: Number(e.target.value) }, 'meter');
                    setLastCostEdited('meter');
                    setFormData(next);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_total_no_ipi">Custo total sem IPI</Label>
                <Input
                  id="cost_total_no_ipi"
                  type="number"
                  step="0.01"
                  value={formData.cost_total_no_ipi}
                  disabled={costInputMode !== 'total'}
                  onChange={(e) => {
                    const next = recalc({ ...formData, cost_total_no_ipi: Number(e.target.value) }, 'total');
                    setLastCostEdited('total');
                    setFormData(next);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipi_percentage">% IPI</Label>
                <Input
                  id="ipi_percentage"
                  type="number"
                  step="0.01"
                  value={formData.ipi_percentage}
                  onChange={(e) => setFormData(recalc({ ...formData, ipi_percentage: Number(e.target.value) }, lastCostEdited))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Button
                type="button"
                variant={costInputMode === 'meter' ? 'default' : 'outline'}
                onClick={() => {
                  setCostInputMode('meter');
                  setLastCostEdited('meter');
                  setFormData(recalc(formData, 'meter'));
                }}
              >
                Editar custo por metro
              </Button>
              <Button
                type="button"
                variant={costInputMode === 'total' ? 'default' : 'outline'}
                onClick={() => {
                  setCostInputMode('total');
                  setLastCostEdited('total');
                  setFormData(recalc(formData, 'total'));
                }}
              >
                Editar custo total
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_per_m2_no_ipi">Custo por m² sem IPI</Label>
                <Input id="cost_per_m2_no_ipi" value={formatBRL(formData.cost_per_m2_no_ipi, 4)} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_m2_with_ipi">Custo por m² com IPI</Label>
                <Input id="cost_per_m2_with_ipi" value={formatBRL(formData.cost_per_m2_with_ipi, 4)} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_total_with_ipi">Custo total com IPI</Label>
                <Input id="cost_total_with_ipi" value={formatBRL(formData.cost_total_with_ipi, 2)} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_kg">Custo por kg (opcional)</Label>
                <Input
                  id="cost_per_kg"
                  type="number"
                  step="0.0001"
                  value={formData.cost_per_kg ?? ''}
                  onChange={(e) => setFormData({ ...formData, cost_per_kg: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
              <Label>Ativo</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingItem ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a bobina "{deletingItem?.name}"?
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
