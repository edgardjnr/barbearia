import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReportsFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void;
}

export interface ReportFilters {
  startDate: Date | null;
  endDate: Date | null;
  selectedEmployee: string | null;
  selectedClient: string | null;
}

interface Employee {
  id: string;
  display_name: string;
}

interface Client {
  id: string;
  name: string;
}

const ReportsFilters = ({ onFiltersChange }: ReportsFiltersProps) => {
  const { organization } = useAuth();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Load employees and clients
  useEffect(() => {
    if (!organization?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load employees (organization members, excluding owner)
        const { data: membersData } = await supabase
          .from('organization_members')
          .select(`
            id,
            user_id,
            role,
            profiles!inner(display_name)
          `)
          .eq('organization_id', organization.id)
          .eq('status', 'active')
          .neq('role', 'owner');

        const employeesData = membersData?.map(member => ({
          id: member.id, // Usar o ID do organization_members, não o user_id
          display_name: member.profiles?.display_name || 'Sem nome'
        })) || [];

        // Load clients
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, name')
          .eq('organization_id', organization.id)
          .order('name');

        setEmployees(employeesData);
        setClients(clientsData || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organization?.id]);

  // Update filters when values change
  useEffect(() => {
    const currentFilters = {
      startDate,
      endDate,
      selectedEmployee,
      selectedClient
    };
    
    onFiltersChange(currentFilters);
  }, [startDate, endDate, selectedEmployee, selectedClient]);

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedEmployee(null);
    setSelectedClient(null);
  };

  const hasActiveFilters = startDate || endDate || selectedEmployee || selectedClient;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data Inicial */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate || undefined}
                  onSelect={setStartDate}
                  disabled={(date) => endDate ? date > endDate : false}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Final */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={setEndDate}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Colaborador */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Colaborador</label>
            <Select 
              value={selectedEmployee || undefined} 
              onValueChange={setSelectedEmployee}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os colaboradores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os colaboradores</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select 
              value={selectedClient || undefined} 
              onValueChange={setSelectedClient}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {startDate && (
              <Badge variant="secondary">
                Início: {format(startDate, "dd/MM/yyyy")}
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary">
                Fim: {format(endDate, "dd/MM/yyyy")}
              </Badge>
            )}
            {selectedEmployee && selectedEmployee !== "all" && (
              <Badge variant="secondary">
                Colaborador: {employees.find(e => e.id === selectedEmployee)?.display_name}
              </Badge>
            )}
            {selectedClient && selectedClient !== "all" && (
              <Badge variant="secondary">
                Cliente: {clients.find(c => c.id === selectedClient)?.name}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportsFilters;