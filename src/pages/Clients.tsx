import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { 
  Users, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  History
} from "lucide-react";
import { ClientServiceHistory } from "@/components/ClientServiceHistory";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

const Clients = () => {
  const { user, organization } = useAuth();
  const isMobile = useIsMobile();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    birth_date: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (organization) {
      loadClients();
    }
  }, [organization]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('name', { ascending: true });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes.",
          variant: "destructive",
        });
        console.error('Error loading clients:', error);
      } else {
        setClients(data || []);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar clientes.",
        variant: "destructive",
      });
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization?.id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso.",
          variant: "success",
        });
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([{
            ...formData,
            organization_id: organization.id
          }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cliente adicionado com sucesso.",
          variant: "success",
        });
      }

      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        birth_date: ""
      });
      loadClients();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente.",
        variant: "destructive",
      });
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
      birth_date: client.birth_date || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso.",
        variant: "success",
      });
      loadClients();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente.",
        variant: "destructive",
      });
      console.error('Error deleting client:', error);
    }
  };

  const handleViewHistory = (client: Client) => {
    setSelectedClientForHistory(client);
    setIsHistoryOpen(true);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  if (!organization) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="text-center py-8">
          <p className="text-text-secondary">
            Organização não encontrada. Configure sua organização primeiro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Clientes" icon={Users} />}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Clientes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto"
              onClick={() => {
                setEditingClient(null);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  address: "",
                  notes: "",
                  birth_date: ""
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Adicionar Cliente</span>
              <span className="sm:hidden">Novo Cliente</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md sm:max-w-[425px] mx-4">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Adicionar Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? "Altere as informações do cliente abaixo."
                  : "Preencha as informações do novo cliente abaixo."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                  {editingClient ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Buscar Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary">Lista de Clientes</CardTitle>
          <CardDescription className="text-text-secondary">
            {filteredClients.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>

        {loading ? (
          <CardContent className="p-6">
            <div className="text-center py-4">
              <Users className="w-6 h-6 animate-pulse mx-auto mb-2 text-primary" />
              <p className="text-sm text-text-secondary">Carregando clientes...</p>
            </div>
          </CardContent>
        ) : filteredClients.length === 0 ? (
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-text-secondary">
                {searchTerm ? "Nenhum cliente encontrado para a busca." : "Nenhum cliente cadastrado ainda."}
              </p>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            {/* Mobile View */}
            <div className="block lg:hidden space-y-4">
              {filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-text-primary truncate">{client.name}</h3>
                        {client.birth_date && (
                          <p className="text-xs text-text-secondary">
                            Aniversário: {new Date(client.birth_date).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-text-secondary text-sm truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-text-secondary text-sm">{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-text-secondary text-sm">{client.address}</span>
                        </div>
                      )}
                      {client.notes && (
                        <div className="bg-muted/50 p-2 rounded text-xs text-text-secondary">
                          {client.notes}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHistory(client)}
                        className="flex-1 text-xs"
                      >
                        <History className="w-3 h-3 mr-1" />
                        Histórico
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        className="flex-1 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Nome</TableHead>
                      <TableHead className="w-[200px]">Contato</TableHead>
                      <TableHead className="w-[150px]">Endereço</TableHead>
                      <TableHead className="w-[120px]">Observações</TableHead>
                      <TableHead className="text-right w-[130px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="text-text-primary truncate max-w-[120px]">{client.name}</p>
                            {client.birth_date && (
                              <p className="text-xs text-text-secondary">
                                Aniversário: {new Date(client.birth_date).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="text-text-secondary truncate max-w-[150px]">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="text-text-secondary">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.address && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="text-text-secondary truncate max-w-[120px]">{client.address}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-text-secondary text-sm truncate max-w-[100px] block">{client.notes}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(client)}
                              title="Ver histórico de serviços"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Com Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {clients.filter(c => c.email).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {clients.length > 0 ? Math.round((clients.filter(c => c.email).length / clients.length) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Com Telefone</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {clients.filter(c => c.phone).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {clients.length > 0 ? Math.round((clients.filter(c => c.phone).length / clients.length) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service History Modal */}
      {selectedClientForHistory && (
        <ClientServiceHistory
          isOpen={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          clientId={selectedClientForHistory.id}
          clientName={selectedClientForHistory.name}
        />
      )}
    </div>
  );
};

export default Clients;