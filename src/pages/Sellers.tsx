import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Seller } from '@/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Search, UserCog, Users } from 'lucide-react';
import { toast } from 'sonner';

const emptySeller: Omit<Seller, 'id' | 'created_at' | 'updated_at'> = {
  nome: '',
  email: '',
  telefone: '',
  comissao_padrao_percent: 5,
  clientes_ids: [],
  ativo: true,
  observacoes: '',
};

export default function Sellers() {
  const { sellers, clients, addSeller, updateSeller, deleteSeller } = useApp();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [deletingSeller, setDeletingSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState(emptySeller);

  const filteredSellers = sellers.filter(seller => 
    seller.nome.toLowerCase().includes(search.toLowerCase()) ||
    seller.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (seller?: Seller) => {
    if (seller) {
      setEditingSeller(seller);
      setFormData({
        nome: seller.nome,
        email: seller.email,
        telefone: seller.telefone,
        comissao_padrao_percent: seller.comissao_padrao_percent,
        clientes_ids: seller.clientes_ids,
        ativo: seller.ativo,
        observacoes: seller.observacoes,
      });
    } else {
      setEditingSeller(null);
      setFormData(emptySeller);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome) {
      toast.error('Preencha o nome do vendedor');
      return;
    }

    if (editingSeller) {
      updateSeller(editingSeller.id, formData);
      toast.success('Vendedor atualizado com sucesso!');
    } else {
      const newSeller: Seller = {
        ...formData,
        id: `seller-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSeller(newSeller);
      toast.success('Vendedor cadastrado com sucesso!');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingSeller) {
      deleteSeller(deletingSeller.id);
      toast.success('Vendedor excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingSeller(null);
    }
  };

  const toggleClientLink = (clientId: string) => {
    const currentIds = formData.clientes_ids;
    if (currentIds.includes(clientId)) {
      setFormData({ ...formData, clientes_ids: currentIds.filter(id => id !== clientId) });
    } else {
      setFormData({ ...formData, clientes_ids: [...currentIds, clientId] });
    }
  };

  const getClientNames = (clientIds: string[]) => {
    return clientIds
      .map(id => clients.find(c => c.id === id)?.nome_fantasia)
      .filter(Boolean)
      .join(', ');
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
                <TableHead>Clientes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.nome}</TableCell>
                    <TableCell>{seller.email}</TableCell>
                    <TableCell>{seller.telefone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {seller.comissao_padrao_percent}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{seller.clientes_ids.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={seller.ativo ? 'default' : 'secondary'}>
                        {seller.ativo ? 'Ativo' : 'Inativo'}
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
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do vendedor"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comissao">Comissão Padrão (%)</Label>
                <Input
                  id="comissao"
                  type="number"
                  step="0.5"
                  value={formData.comissao_padrao_percent}
                  onChange={(e) => setFormData({ ...formData, comissao_padrao_percent: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Vendedor Ativo</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clientes Vinculados
              </h4>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`client-${client.id}`}
                      checked={formData.clientes_ids.includes(client.id)}
                      onCheckedChange={() => toggleClientLink(client.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`client-${client.id}`} className="text-sm font-medium cursor-pointer">
                        {client.nome_fantasia}
                      </Label>
                      <p className="text-xs text-muted-foreground truncate">{client.cnpj}</p>
                    </div>
                  </div>
                ))}
              </div>
              {formData.clientes_ids.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.clientes_ids.length} cliente(s) vinculado(s)
                </p>
              )}
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
              Tem certeza que deseja excluir o vendedor "{deletingSeller?.nome}"?
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
