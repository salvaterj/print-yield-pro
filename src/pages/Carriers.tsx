import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Carrier } from '@/types';
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
import { Plus, Pencil, Trash2, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';

const emptyCarrier: Omit<Carrier, 'id' | 'created_at' | 'updated_at'> = {
  code: '',
  name: '',
  cnpj: '',
  phone: '',
  whatsapp: '',
  email: '',
  zip_code: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  delivery_time_days: 0,
  notes: '',
  active: true,
};

export default function Carriers() {
  const { carriers, addCarrier, updateCarrier, deleteCarrier } = useApp();
  
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [deletingCarrier, setDeletingCarrier] = useState<Carrier | null>(null);
  const [formData, setFormData] = useState(emptyCarrier);

  const filteredCarriers = carriers.filter(carrier =>
    (carrier.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (carrier.cnpj?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleOpenDialog = (carrier?: Carrier) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setFormData({
        code: carrier.code || '',
        name: carrier.name || '',
        cnpj: carrier.cnpj || '',
        phone: carrier.phone || '',
        whatsapp: carrier.whatsapp || '',
        email: carrier.email || '',
        zip_code: carrier.zip_code || '',
        address: carrier.address || '',
        number: carrier.number || '',
        complement: carrier.complement || '',
        neighborhood: carrier.neighborhood || '',
        city: carrier.city || '',
        state: carrier.state || '',
        delivery_time_days: carrier.delivery_time_days || 0,
        notes: carrier.notes || '',
        active: carrier.active ?? true,
      });
    } else {
      setEditingCarrier(null);
      setFormData(emptyCarrier);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome da transportadora');
      return;
    }

    try {
      if (editingCarrier) {
        await updateCarrier(editingCarrier.id, formData);
        toast.success('Transportadora atualizada com sucesso!');
      } else {
        await addCarrier(formData);
        toast.success('Transportadora cadastrada com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar transportadora');
    }
  };

  const handleDelete = async () => {
    if (deletingCarrier) {
      try {
        await deleteCarrier(deletingCarrier.id);
        toast.success('Transportadora excluída com sucesso!');
        setIsDeleteDialogOpen(false);
        setDeletingCarrier(null);
      } catch (e: any) {
        toast.error(e?.message || 'Falha ao excluir transportadora');
      }
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatZipCode = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const formatUF = (value: string) => value.toUpperCase().slice(0, 2);

  const formatCode = (value: string) => value.replace(/[^\dA-Za-z_-]/g, '').slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Transportadoras
          </h1>
          <p className="text-muted-foreground">Gerencie as transportadoras cadastradas</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transportadora
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredCarriers.length} transportadora(s)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma transportadora encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCarriers.map((carrier) => (
                  <TableRow key={carrier.id}>
                    <TableCell className="font-medium">{carrier.name}</TableCell>
                    <TableCell>{carrier.cnpj}</TableCell>
                    <TableCell>{carrier.phone}</TableCell>
                    <TableCell>{carrier.email}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(carrier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingCarrier(carrier);
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
              {editingCarrier ? 'Editar Transportadora' : 'Nova Transportadora'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: formatCode(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: formatZipCode(e.target.value) })}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: formatUF(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_time_days">Prazo de Entrega Padrão (dias)</Label>
                <Input
                  id="delivery_time_days"
                  type="number"
                  value={formData.delivery_time_days}
                  onChange={(e) => setFormData({ ...formData, delivery_time_days: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
                <Label>Ativo</Label>
              </div>
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
              {editingCarrier ? 'Salvar' : 'Cadastrar'}
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
              Tem certeza que deseja excluir a transportadora "{deletingCarrier?.name}"?
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
