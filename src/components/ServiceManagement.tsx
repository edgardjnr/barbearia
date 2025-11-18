import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

const ServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "30",
  });
  const { organization } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, [organization]);

  const fetchServices = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        duration_minutes: parseInt(formData.duration_minutes),
        organization_id: organization.id,
        is_active: true,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Serviço atualizado com sucesso!",
          variant: "success",
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Serviço criado com sucesso!",
          variant: "success",
        });
      }

      setDialogOpen(false);
      setEditingService(null);
      setFormData({ name: "", description: "", price: "", duration_minutes: "30" });
      fetchServices();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price?.toString() || "",
      duration_minutes: service.duration_minutes.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso!",
        variant: "success",
      });
      
      fetchServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      });
    }
  };

  const toggleServiceStatus = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Serviço ${!service.is_active ? 'ativado' : 'desativado'} com sucesso!`,
        variant: "success",
      });
      
      fetchServices();
    } catch (error) {
      console.error('Erro ao alterar status do serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do serviço.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando serviços...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Gerenciar Serviços</CardTitle>
          <CardDescription>
            Cadastre e gerencie os serviços oferecidos pela sua empresa
          </CardDescription>
          
          {/* Add Service Button */}
          <div className="mt-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full"
                  onClick={() => {
                    setEditingService(null);
                    setFormData({ name: "", description: "", price: "", duration_minutes: "30" });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Serviço *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_minutes">Duração (minutos) *</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingService ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum serviço cadastrado ainda.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <Card key={service.id} className="w-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{service.name}</h3>
                    <Badge variant={service.is_active ? "default" : "destructive"}>
                      {service.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {service.price && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        R$ {service.price.toFixed(2)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.duration_minutes} min
                    </div>
                  </div>
                  
                  {/* Action buttons in footer for mobile */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleServiceStatus(service)}
                      className="w-full sm:w-auto"
                    >
                      {service.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4 sm:mr-0" />
                      <span className="sm:hidden ml-2">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-0" />
                      <span className="sm:hidden ml-2">Excluir</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceManagement;