import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign, Scissors, User, FileText, Gift } from "lucide-react";

interface HistoryItem {
  id: string;
  performed_at: string;
  price: number | null;
  notes: string | null;
  service_name: string;
  member_name: string | null;
  type: 'service' | 'redemption';
  points_spent?: number;
  reward_name?: string;
}

interface ClientServiceHistoryProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export const ClientServiceHistory = ({ isOpen, onOpenChange, clientId, clientName }: ClientServiceHistoryProps) => {
  const { organization } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && clientId && organization) {
      loadHistory();
    }
  }, [isOpen, clientId, organization]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Carregar histórico de serviços
      const serviceHistoryPromise = supabase
        .from('service_history')
        .select(`
          id,
          performed_at,
          price,
          notes,
          service_id,
          member_id
        `)
        .eq('client_id', clientId)
        .eq('organization_id', organization?.id);

      // Carregar resgates de fidelidade
      const redemptionsPromise = supabase
        .from('loyalty_redemptions')
        .select(`
          id,
          redeemed_at,
          points_spent,
          notes,
          reward_id,
          loyalty_rewards (
            name
          )
        `)
        .eq('client_id', clientId)
        .eq('organization_id', organization?.id);

      const [serviceResult, redemptionsResult] = await Promise.all([
        serviceHistoryPromise,
        redemptionsPromise
      ]);

      if (serviceResult.error) {
        console.error('Error loading service history:', serviceResult.error);
      }

      if (redemptionsResult.error) {
        console.error('Error loading redemptions:', redemptionsResult.error);
      }

      const serviceData = serviceResult.data || [];
      const redemptionsData = redemptionsResult.data || [];

      // Processar histórico de serviços
      let formattedHistory: HistoryItem[] = [];

      if (serviceData.length > 0) {
        // Buscar informações dos serviços e membros
        const serviceIds = [...new Set(serviceData.map(item => item.service_id).filter(Boolean))];
        const memberIds = [...new Set(serviceData.map(item => item.member_id).filter(Boolean))];

        const servicesPromise = serviceIds.length > 0 
          ? supabase.from('services').select('id, name').in('id', serviceIds)
          : Promise.resolve({ data: [], error: null });

        const membersPromise = memberIds.length > 0
          ? supabase
              .from('organization_members')
              .select(`
                id,
                profiles:user_id (display_name)
              `)
              .in('id', memberIds)
          : Promise.resolve({ data: [], error: null });

        const [servicesResult, membersResult] = await Promise.all([servicesPromise, membersPromise]);

        const servicesMap = new Map<string, string>(
          servicesResult.data?.map(s => [s.id, s.name] as [string, string]) || []
        );
        const membersMap = new Map<string, string>(
          membersResult.data?.map((m: any) => [m.id, m.profiles?.display_name] as [string, string]).filter(([_, name]) => name) || []
        );

        const serviceHistory: HistoryItem[] = serviceData.map((item: any) => ({
          id: item.id,
          performed_at: item.performed_at,
          price: item.price,
          notes: item.notes,
          service_name: servicesMap.get(item.service_id) || 'Serviço não encontrado',
          member_name: membersMap.get(item.member_id) || null,
          type: 'service'
        }));

        formattedHistory = [...formattedHistory, ...serviceHistory];
      }

      // Processar resgates de fidelidade
      if (redemptionsData.length > 0) {
        const redemptionHistory: HistoryItem[] = redemptionsData.map((item: any) => ({
          id: item.id,
          performed_at: item.redeemed_at,
          price: null,
          notes: item.notes,
          service_name: 'Resgate de Fidelidade',
          member_name: null,
          type: 'redemption',
          points_spent: item.points_spent,
          reward_name: item.loyalty_rewards?.name || 'Recompensa não encontrada'
        }));

        formattedHistory = [...formattedHistory, ...redemptionHistory];
      }

      // Ordenar por data (mais recente primeiro)
      formattedHistory.sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime());
        
      setHistory(formattedHistory);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar histórico.",
        variant: "destructive",
      });
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalSpent = history.filter(item => item.type === 'service').reduce((total, item) => total + (item.price || 0), 0);
  const totalRedemptions = history.filter(item => item.type === 'redemption').length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Histórico Completo - {clientName}
          </DialogTitle>
          <DialogDescription>
            Visualize todos os serviços realizados e resgates de fidelidade para este cliente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 flex-shrink-0">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Total de Serviços</span>
              </div>
              <p className="text-2xl font-bold text-primary">{history.filter(item => item.type === 'service').length}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Resgates</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{totalRedemptions}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Total Gasto</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
            </div>
          </div>

          {/* History Table */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full w-full rounded-md border">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Scissors className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Scissors className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum histórico encontrado para este cliente.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Valor/Pontos</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(item.performed_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.type === 'service' ? (
                              <Scissors className="w-4 h-4 text-primary" />
                            ) : (
                              <Gift className="w-4 h-4 text-purple-600" />
                            )}
                            <Badge variant={item.type === 'service' ? "default" : "secondary"}>
                              {item.type === 'service' ? 'Serviço' : 'Resgate'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.service_name}</span>
                            {item.type === 'redemption' && item.reward_name && (
                              <span className="text-sm text-purple-600">{item.reward_name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.member_name ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{item.member_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.type === 'service' ? (
                            <Badge variant={item.price ? "default" : "secondary"}>
                              {formatCurrency(item.price)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-purple-600 border-purple-600">
                              -{item.points_spent} pts
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.notes ? (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{item.notes}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};