import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { RawMaterial, MaterialType, Finishing, BaseColor, StockStatus } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const emptyMaterial: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at' | 'custo_por_m'> = {
  nome: '',
  tipo: 'couche',
  acabamento: 'fosco',
  cor_base: 'branco',
  largura_mm: 0,
  comprimento_m: 0,
  gramatura: undefined,
  lote: '',
  fornecedor: '',
  custo_total: 0,
  estoque_status: 'em_estoque',
  saldo_m: 0,
  observacoes: '',
};

const statusColors: Record<StockStatus, string> = {
  em_estoque: 'bg-status-success/20 text-status-success',
  reservada: 'bg-status-warning/20 text-status-warning',
  consumida: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<StockStatus, string> = {
  em_estoque: 'Em Estoque',
  reservada: 'Reservada',
  consumida: 'Consumida',
};

export default function RawMaterials() {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState(emptyMaterial);

  const filteredMaterials = rawMaterials.filter(material => {
    const matchesSearch = material.nome.toLowerCase().includes(search.toLowerCase()) ||
      material.lote.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || material.estoque_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (material?: RawMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        nome: material.nome,
        tipo: material.tipo,
        acabamento: material.acabamento,
        cor_base: material.cor_base,
        largura_mm: material.largura_mm,
        comprimento_m: material.comprimento_m,
        gramatura: material.gramatura,
        lote: material.lote,
        fornecedor: material.fornecedor,
        custo_total: material.custo_total,
        estoque_status: material.estoque_status,
        saldo_m: material.saldo_m,
        observacoes: material.observacoes,
      });
    } else {
      setEditingMaterial(null);
      setFormData(emptyMaterial);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || formData.largura_mm <= 0 || formData.comprimento_m <= 0) {
      toast.error('Preencha os campos obrigatórios corretamente');
      return;
    }

    const custo_por_m = formData.comprimento_m > 0 ? formData.custo_total / formData.comprimento_m : 0;

    if (editingMaterial) {
      updateRawMaterial(editingMaterial.id, { ...formData, custo_por_m });
      toast.success('Bobina atualizada com sucesso!');
    } else {
      const newMaterial: RawMaterial = {
        ...formData,
        custo_por_m,
        saldo_m: formData.saldo_m || formData.comprimento_m,
        id: `bob-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addRawMaterial(newMaterial);
      toast.success('Bobina cadastrada com sucesso!');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingMaterial) {
      deleteRawMaterial(deletingMaterial.id);
      toast.success('Bobina excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingMaterial(null);
    }
  };

  const isLowStock = (material: RawMaterial) => {
    return material.saldo_m < material.comprimento_m * 0.3 && material.estoque_status !== 'consumida';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Bobinas (Matéria-prima)
          </h1>
          <p className="text-muted-foreground">Controle de estoque de bobinas</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Bobina
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou lote..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StockStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="em_estoque">Em Estoque</SelectItem>
                <SelectItem value="reservada">Reservada</SelectItem>
                <SelectItem value="consumida">Consumida</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {filteredMaterials.length} bobina(s)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Largura</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Custo/m</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma bobina encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id} className={isLowStock(material) ? 'bg-status-warning/5' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isLowStock(material) && (
                          <AlertTriangle className="h-4 w-4 text-status-warning" />
                        )}
                        {material.nome}
                      </div>
                      <span className="text-xs text-muted-foreground">Lote: {material.lote}</span>
                    </TableCell>
                    <TableCell className="capitalize">{material.tipo}</TableCell>
                    <TableCell>{material.largura_mm}mm</TableCell>
                    <TableCell>
                      <span className={isLowStock(material) ? 'text-status-warning font-medium' : ''}>
                        {material.saldo_m}m
                      </span>
                      <span className="text-muted-foreground"> / {material.comprimento_m}m</span>
                    </TableCell>
                    <TableCell>R$ {material.custo_por_m.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[material.estoque_status]}>
                        {statusLabels[material.estoque_status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(material)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingMaterial(material);
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

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Editar Bobina' : 'Nova Bobina'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Bobina Couche 107mm 1000m"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v) => setFormData({ ...formData, tipo: v as MaterialType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="couche">Couche</SelectItem>
                    <SelectItem value="termica">Térmica</SelectItem>
                    <SelectItem value="nylon">Nylon</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Acabamento</Label>
                <Select 
                  value={formData.acabamento} 
                  onValueChange={(v) => setFormData({ ...formData, acabamento: v as Finishing })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fosco">Fosco</SelectItem>
                    <SelectItem value="brilho">Brilho</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cor Base</Label>
                <Select 
                  value={formData.cor_base} 
                  onValueChange={(v) => setFormData({ ...formData, cor_base: v as BaseColor })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branco">Branco</SelectItem>
                    <SelectItem value="transparente">Transparente</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="largura_mm">Largura (mm) *</Label>
                <Input
                  id="largura_mm"
                  type="number"
                  value={formData.largura_mm || ''}
                  onChange={(e) => setFormData({ ...formData, largura_mm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comprimento_m">Comprimento (m) *</Label>
                <Input
                  id="comprimento_m"
                  type="number"
                  value={formData.comprimento_m || ''}
                  onChange={(e) => setFormData({ ...formData, comprimento_m: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gramatura">Gramatura (g/m²)</Label>
                <Input
                  id="gramatura"
                  type="number"
                  value={formData.gramatura || ''}
                  onChange={(e) => setFormData({ ...formData, gramatura: Number(e.target.value) || undefined })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lote">Lote</Label>
                <Input
                  id="lote"
                  value={formData.lote}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custo_total">Custo Total (R$)</Label>
                <Input
                  id="custo_total"
                  type="number"
                  step="0.01"
                  value={formData.custo_total || ''}
                  onChange={(e) => setFormData({ ...formData, custo_total: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saldo_m">Saldo Atual (m)</Label>
                <Input
                  id="saldo_m"
                  type="number"
                  value={formData.saldo_m || ''}
                  onChange={(e) => setFormData({ ...formData, saldo_m: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.estoque_status} 
                  onValueChange={(v) => setFormData({ ...formData, estoque_status: v as StockStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_estoque">Em Estoque</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                    <SelectItem value="consumida">Consumida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingMaterial ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a bobina "{deletingMaterial?.nome}"?
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
