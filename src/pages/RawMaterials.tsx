import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { RawProduct } from '@/types';
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
  cost_per_kg: null,
  supplier_name: '',
  notes: '',
  active: true,
};

export default function RawMaterials() {
  const { rawProducts, addRawProduct, updateRawProduct, deleteRawProduct } = useApp();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RawProduct | null>(null);
  const [deletingItem, setDeletingItem] = useState<RawProduct | null>(null);
  const [formData, setFormData] = useState(emptyRawProduct);

  const filtered = rawProducts.filter((rp) =>
    (rp.code?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (rp.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (rp.material_type?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleOpenDialog = (item?: RawProduct) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code || '',
        name: item.name || '',
        material_type: item.material_type || '',
        width_mm: item.width_mm || 0,
        length_m: item.length_m || 0,
        thickness_microns: item.thickness_microns || 0,
        usable_width_mm: item.usable_width_mm || 0,
        waste_percentage: item.waste_percentage || 0,
        cost_per_meter: item.cost_per_meter || 0,
        cost_per_kg: item.cost_per_kg ?? null,
        supplier_name: item.supplier_name || '',
        notes: item.notes || '',
        active: item.active ?? true,
      });
    } else {
      setEditingItem(null);
      setFormData(emptyRawProduct);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome da bobina/matéria-prima');
      return;
    }

    try {
      if (editingItem) {
        await updateRawProduct(editingItem.id, formData);
        toast.success('Bobina atualizada com sucesso!');
      } else {
        await addRawProduct(formData);
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
                <TableHead className="text-right">Custo/m</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma bobina encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rp) => (
                  <TableRow key={rp.id}>
                    <TableCell>{rp.code}</TableCell>
                    <TableCell className="font-medium">{rp.name}</TableCell>
                    <TableCell>{rp.material_type}</TableCell>
                    <TableCell className="text-right">{rp.width_mm}</TableCell>
                    <TableCell className="text-right">R$ {rp.cost_per_meter.toFixed(4)}</TableCell>
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
                  onChange={(e) => setFormData({ ...formData, length_m: Number(e.target.value) })}
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
                  onChange={(e) => setFormData({ ...formData, usable_width_mm: Number(e.target.value) })}
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
                <Label htmlFor="cost_per_meter">Custo por metro</Label>
                <Input
                  id="cost_per_meter"
                  type="number"
                  step="0.0001"
                  value={formData.cost_per_meter}
                  onChange={(e) => setFormData({ ...formData, cost_per_meter: Number(e.target.value) })}
                />
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
              <div className="flex items-center gap-2 pt-8">
                <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
                <Label>Ativo</Label>
              </div>
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
