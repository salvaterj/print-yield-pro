import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { FinishedProduct, MaterialType, Finishing, BaseColor, BladeType } from '@/types';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, PackageSearch, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const emptyProduct: Omit<FinishedProduct, 'id' | 'created_at' | 'updated_at'> = {
  nome: '',
  material_requerido: 'couche',
  largura_mm: 0,
  altura_mm: 0,
  metragem_por_rolo_m: 0,
  quantidade_por_rolo: undefined,
  acabamento: 'fosco',
  cor_base: 'branco',
  faca_01: 'reta',
  faca_02: undefined,
  pantone_1: '',
  pantone_2: '',
  pantone_3: '',
  anilox_1: '',
  anilox_2: '',
  anilox_3: '',
  chapado: false,
  preco_base: undefined,
  estoque_rolos: 0,
  estoque_minimo_rolos: 0,
  observacoes: '',
};

export default function FinishedProducts() {
  const { finishedProducts, addFinishedProduct, updateFinishedProduct, deleteFinishedProduct } = useApp();
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState<MaterialType | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FinishedProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<FinishedProduct | null>(null);
  const [formData, setFormData] = useState(emptyProduct);

  const filteredProducts = finishedProducts.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(search.toLowerCase());
    const matchesMaterial = materialFilter === 'all' || product.material_requerido === materialFilter;
    return matchesSearch && matchesMaterial;
  });

  const handleOpenDialog = (product?: FinishedProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nome: product.nome,
        material_requerido: product.material_requerido,
        largura_mm: product.largura_mm,
        altura_mm: product.altura_mm,
        metragem_por_rolo_m: product.metragem_por_rolo_m,
        quantidade_por_rolo: product.quantidade_por_rolo,
        acabamento: product.acabamento,
        cor_base: product.cor_base,
        faca_01: product.faca_01,
        faca_02: product.faca_02,
        pantone_1: product.pantone_1,
        pantone_2: product.pantone_2,
        pantone_3: product.pantone_3,
        anilox_1: product.anilox_1,
        anilox_2: product.anilox_2,
        anilox_3: product.anilox_3,
        chapado: product.chapado,
        preco_base: product.preco_base,
        estoque_rolos: product.estoque_rolos,
        estoque_minimo_rolos: product.estoque_minimo_rolos,
        observacoes: product.observacoes,
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyProduct);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || formData.largura_mm <= 0 || formData.metragem_por_rolo_m <= 0) {
      toast.error('Preencha os campos obrigatórios corretamente');
      return;
    }

    if (editingProduct) {
      updateFinishedProduct(editingProduct.id, formData);
      toast.success('Produto atualizado com sucesso!');
    } else {
      const newProduct: FinishedProduct = {
        ...formData,
        id: `prod-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addFinishedProduct(newProduct);
      toast.success('Produto cadastrado com sucesso!');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingProduct) {
      deleteFinishedProduct(deletingProduct.id);
      toast.success('Produto excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PackageSearch className="h-6 w-6" />
            Produtos Acabados
          </h1>
          <p className="text-muted-foreground">Catálogo de produtos vendáveis</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={materialFilter} onValueChange={(v) => setMaterialFilter(v as MaterialType | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os materiais</SelectItem>
                <SelectItem value="couche">Couche</SelectItem>
                <SelectItem value="termica">Térmica</SelectItem>
                <SelectItem value="nylon">Nylon</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} produto(s)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Medidas</TableHead>
                <TableHead>Metragem/Rolo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.estoque_rolos < product.estoque_minimo_rolos;
                  return (
                    <TableRow key={product.id} className={isLowStock ? 'bg-status-warning/5' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isLowStock && <AlertTriangle className="h-4 w-4 text-status-warning" />}
                          {product.nome}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.acabamento} / {product.cor_base}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.material_requerido}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.largura_mm}x{product.altura_mm}mm</TableCell>
                      <TableCell>{product.metragem_por_rolo_m}m</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? 'text-status-warning font-medium' : ''}>
                            {product.estoque_rolos}
                          </span>
                          <span className="text-muted-foreground text-xs">rolos</span>
                        </div>
                        {isLowStock && (
                          <p className="text-xs text-status-warning">Mín: {product.estoque_minimo_rolos}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.preco_base ? `R$ ${product.preco_base.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingProduct(product);
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

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Etiqueta 34x23 30m"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Material Requerido *</Label>
                <Select 
                  value={formData.material_requerido} 
                  onValueChange={(v) => setFormData({ ...formData, material_requerido: v as MaterialType })}
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

            <div className="grid grid-cols-4 gap-4">
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
                <Label htmlFor="altura_mm">Altura (mm)</Label>
                <Input
                  id="altura_mm"
                  type="number"
                  value={formData.altura_mm || ''}
                  onChange={(e) => setFormData({ ...formData, altura_mm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metragem_por_rolo_m">Metragem/Rolo (m) *</Label>
                <Input
                  id="metragem_por_rolo_m"
                  type="number"
                  value={formData.metragem_por_rolo_m || ''}
                  onChange={(e) => setFormData({ ...formData, metragem_por_rolo_m: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade_por_rolo">Qtd/Rolo</Label>
                <Input
                  id="quantidade_por_rolo"
                  type="number"
                  value={formData.quantidade_por_rolo || ''}
                  onChange={(e) => setFormData({ ...formData, quantidade_por_rolo: Number(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Faca 01</Label>
                <Select 
                  value={formData.faca_01} 
                  onValueChange={(v) => setFormData({ ...formData, faca_01: v as BladeType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reta">Reta</SelectItem>
                    <SelectItem value="bolinha">Bolinha</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Faca 02</Label>
                <Select 
                  value={formData.faca_02 || 'none'} 
                  onValueChange={(v) => setFormData({ ...formData, faca_02: v === 'none' ? undefined : v as BladeType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="reta">Reta</SelectItem>
                    <SelectItem value="bolinha">Bolinha</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_base">Preço Base (R$)</Label>
                <Input
                  id="preco_base"
                  type="number"
                  step="0.01"
                  value={formData.preco_base || ''}
                  onChange={(e) => setFormData({ ...formData, preco_base: Number(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-3">Estoque</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoque_rolos">Estoque Atual (rolos)</Label>
                  <Input
                    id="estoque_rolos"
                    type="number"
                    value={formData.estoque_rolos || ''}
                    onChange={(e) => setFormData({ ...formData, estoque_rolos: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo_rolos">Estoque Mínimo (rolos)</Label>
                  <Input
                    id="estoque_minimo_rolos"
                    type="number"
                    value={formData.estoque_minimo_rolos || ''}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo_rolos: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-3">Parâmetros Técnicos Padrão</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pantone_1">Pantone 1</Label>
                  <Input
                    id="pantone_1"
                    value={formData.pantone_1}
                    onChange={(e) => setFormData({ ...formData, pantone_1: e.target.value })}
                    placeholder="Ex: Pantone 485 C"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pantone_2">Pantone 2</Label>
                  <Input
                    id="pantone_2"
                    value={formData.pantone_2}
                    onChange={(e) => setFormData({ ...formData, pantone_2: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pantone_3">Pantone 3</Label>
                  <Input
                    id="pantone_3"
                    value={formData.pantone_3}
                    onChange={(e) => setFormData({ ...formData, pantone_3: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="anilox_1">Anilox 1</Label>
                  <Input
                    id="anilox_1"
                    value={formData.anilox_1}
                    onChange={(e) => setFormData({ ...formData, anilox_1: e.target.value })}
                    placeholder="Ex: 400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anilox_2">Anilox 2</Label>
                  <Input
                    id="anilox_2"
                    value={formData.anilox_2}
                    onChange={(e) => setFormData({ ...formData, anilox_2: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anilox_3">Anilox 3</Label>
                  <Input
                    id="anilox_3"
                    value={formData.anilox_3}
                    onChange={(e) => setFormData({ ...formData, anilox_3: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Switch
                  id="chapado"
                  checked={formData.chapado}
                  onCheckedChange={(checked) => setFormData({ ...formData, chapado: checked })}
                />
                <Label htmlFor="chapado">Chapado</Label>
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
              {editingProduct ? 'Salvar' : 'Cadastrar'}
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
              Tem certeza que deseja excluir o produto "{deletingProduct?.nome}"?
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
