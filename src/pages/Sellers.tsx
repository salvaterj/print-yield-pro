import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Salesperson } from '@/types';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, UserCog } from 'lucide-react';
import { toast } from 'sonner';

const emptySeller: Omit<Salesperson, 'id' | 'created_at' | 'updated_at'> = {
  code: '',
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  commission_type: 'percentage',
  commission_value: 0,
  notes: '',
  active: true,
};

export default function Sellers() {
  const { salespeople, addSalesperson, updateSalesperson, deleteSalesperson } = useApp();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Salesperson | null>(null);
  const [deletingSeller, setDeletingSeller] = useState<Salesperson | null>(null);
  const [formData, setFormData] = useState(emptySeller);

  const filteredSellers = salespeople.filter((seller) =>
    (seller.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (seller.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleOpenDialog = (seller?: Salesperson) => {
    if (seller) {
      setEditingSeller(seller);
      setFormData({
        code: seller.code || '',
        name: seller.name || '',
        phone: seller.phone || '',
        whatsapp: seller.whatsapp || '',
        email: seller.email || '',
        commission_type: seller.commission_type || 'percentage',
        commission_value: seller.commission_value || 0,
        notes: seller.notes || '',
        active: seller.active ?? true,
      });
    } else {
      setEditingSeller(null);
      setFormData(emptySeller);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome do vendedor');
      return;
    }

    try {
      if (editingSeller) {
        await updateSalesperson(editingSeller.id, formData);
        toast.success('Vendedor atualizado com sucesso!');
      } else {
        await addSalesperson(formData);
        toast.success('Vendedor cadastrado com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar vendedor');
    }
  };

  const handleDelete = async () => {
    if (deletingSeller) {
      try {
        await deleteSalesperson(deletingSeller.id);
        toast.success('Vendedor excluído com sucesso!');
        setIsDeleteDialogOpen(false);
        setDeletingSeller(null);
      } catch (e: any) {
        toast.error(e?.message || 'Falha ao excluir vendedor');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            Vendedores
          </h1>
          <p className="text-muted-foreground">Cadastro de vendedores e comissões</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Vendedor
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredSellers.length} vendedor(es)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.email}</TableCell>
                    <TableCell>{seller.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {seller.commission_type === 'fixed'
                          ? `R$ ${seller.commission_value.toFixed(2)}`
                          : `${seller.commission_value}%`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={seller.active ? 'default' : 'secondary'}>
                        {seller.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(seller)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingSeller(seller);
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
              {editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do vendedor"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de comissão</Label>
                <Select value={formData.commission_type} onValueChange={(v) => setFormData({ ...formData, commission_type: v as Salesperson['commission_type'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed">Valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission_value">
                  {formData.commission_type === 'fixed' ? 'Comissão (R$)' : 'Comissão (%)'}
                </Label>
                <Input
                  id="commission_value"
                  type="number"
                  step={formData.commission_type === 'fixed' ? '0.01' : '0.1'}
                  value={formData.commission_value}
                  onChange={(e) => setFormData({ ...formData, commission_value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Vendedor Ativo</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingSeller ? 'Salvar' : 'Cadastrar'}
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
              Tem certeza que deseja excluir o vendedor "{deletingSeller?.name}"?
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
