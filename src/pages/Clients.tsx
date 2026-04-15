import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Company } from '@/types';
import { fetchAddressByCEP } from '@/lib/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

const emptyClient: Omit<Company, 'id' | 'created_at' | 'updated_at'> = {
  code: '',
  name: '',
  trade_name: '',
  cnpj: '',
  state_registration: '',
  state_registration_isento: false,
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
  salesperson_id: '',
  default_carrier_id: '',
  notes: '',
  active: true,
};

export default function Clients() {
  const { companies, carriers, salespeople, addCompany, updateCompany, deleteCompany, generateNextCompanyCode } = useApp();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Company | null>(null);
  const [deletingClient, setDeletingClient] = useState<Company | null>(null);
  const [formData, setFormData] = useState(emptyClient);

  const filteredClients = companies.filter((company) =>
    (company.trade_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (company.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (company.cnpj?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (company.city?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleOpenDialog = (client?: Company) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        code: client.code || '',
        name: client.name || '',
        trade_name: client.trade_name || '',
        cnpj: client.cnpj || '',
        state_registration: client.state_registration || '',
        state_registration_isento: client.state_registration_isento ?? false,
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        zip_code: client.zip_code || '',
        address: client.address || '',
        number: client.number || '',
        complement: client.complement || '',
        neighborhood: client.neighborhood || '',
        city: client.city || '',
        state: client.state || '',
        salesperson_id: client.salesperson_id || '',
        default_carrier_id: client.default_carrier_id || '',
        notes: client.notes || '',
        active: client.active ?? true,
      });
    } else {
      setEditingClient(null);
      setFormData({ ...emptyClient, code: generateNextCompanyCode() });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.trade_name) {
      toast.error('Preencha o Nome Fantasia');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        salesperson_id: formData.salesperson_id || null,
        default_carrier_id: formData.default_carrier_id || null,
      };

      if (editingClient) {
        await updateCompany(editingClient.id, dataToSave);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await addCompany(dataToSave);
        toast.success('Cliente cadastrado com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar cliente');
    }
  };

  const handleDelete = async () => {
    if (deletingClient) {
      try {
        await deleteCompany(deletingClient.id);
        toast.success('Cliente excluído com sucesso!');
        setIsDeleteDialogOpen(false);
        setDeletingClient(null);
      } catch (e: any) {
        toast.error(e?.message || 'Falha ao excluir cliente');
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

  const salespersonOptions = salespeople.filter((s) => s.active);
  const carrierOptions = carriers.filter((c) => c.active);

  const getSalespersonLabel = (id: string) => {
    const sp = salespeople.find((s) => s.id === id);
    if (!sp) return '';
    return sp.code ? `${sp.code} - ${sp.name}` : sp.name;
  };

  const getCarrierLabel = (id: string) => {
    const c = carriers.find((x) => x.id === id);
    if (!c) return '';
    return c.code ? `${c.code} - ${c.name}` : c.name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clientes
          </h1>
          <p className="text-muted-foreground">Gerencie os clientes da gráfica</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome/cidade/CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredClients.length} cliente(s)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome Fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.code}</TableCell>
                    <TableCell className="font-medium">{client.trade_name}</TableCell>
                    <TableCell>{client.cnpj}</TableCell>
                    <TableCell>{client.city}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingClient(client);
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
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade_name">Nome Fantasia *</Label>
                <Input
                  id="trade_name"
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Razão social / Nome da empresa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state_registration">Inscrição estadual</Label>
                <Input
                  id="state_registration"
                  value={formData.state_registration_isento ? 'ISENTO' : formData.state_registration}
                  onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                  disabled={formData.state_registration_isento}
                  placeholder={formData.state_registration_isento ? 'Isento' : '000.000.00-0'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: formatZipCode(e.target.value) })}
                  onBlur={async (e) => {
                    const address = await fetchAddressByCEP(e.target.value);
                    if (address) {
                      setFormData(prev => ({
                        ...prev,
                        address: address.address,
                        neighborhood: address.neighborhood,
                        city: address.city,
                        state: address.state
                      }));
                    }
                  }}
                  placeholder="00000-000"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.state_registration_isento}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  state_registration_isento: checked,
                  state_registration: checked ? '' : formData.state_registration
                })}
              />
              <Label>Inscrição estadual isenta</Label>
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
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendedor responsável</Label>
                <Select value={formData.salesperson_id || 'none'} onValueChange={(v) => setFormData({ ...formData, salesperson_id: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {salespersonOptions.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {getSalespersonLabel(sp.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transportadora padrão</Label>
                <Select value={formData.default_carrier_id || 'none'} onValueChange={(v) => setFormData({ ...formData, default_carrier_id: v === 'none' ? '' : v })}>
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
            <div className="flex items-center gap-2">
              <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
              <Label>Ativo</Label>
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
              {editingClient ? 'Salvar' : 'Cadastrar'}
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
              Tem certeza que deseja excluir o cliente "{deletingClient?.trade_name}"?
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
