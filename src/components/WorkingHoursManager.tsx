import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Save } from "lucide-react";

interface WorkingHour {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface WorkingHoursManagerProps {
  memberId: string;
  organizationId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export function WorkingHoursManager({ memberId, organizationId }: WorkingHoursManagerProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkingHours();
  }, [memberId]);

  const loadWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('member_id', memberId)
        .order('day_of_week');

      if (error) throw error;

      // Initialize with default hours for all days
      const initialHours = DAYS_OF_WEEK.map(day => {
        const existing = data?.find(h => h.day_of_week === day.value);
        return existing || {
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '18:00',
          is_active: day.value >= 1 && day.value <= 5, // Active Mon-Fri by default
        };
      });

      setWorkingHours(initialHours);
    } catch (error) {
      console.error('Error loading working hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários de trabalho.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing records
      await supabase
        .from('working_hours')
        .delete()
        .eq('organization_id', organizationId)
        .eq('member_id', memberId);

      // Insert new records for active days only
      const activeHours = workingHours
        .filter(hour => hour.is_active)
        .map(hour => ({
          organization_id: organizationId,
          member_id: memberId,
          day_of_week: hour.day_of_week,
          start_time: hour.start_time,
          end_time: hour.end_time,
          is_active: hour.is_active,
        }));

      if (activeHours.length > 0) {
        const { error } = await supabase
          .from('working_hours')
          .insert(activeHours);

        if (error) throw error;
      }

      // Disparar evento customizado para notificar outras páginas sobre a atualização
      window.dispatchEvent(new CustomEvent('workingHoursUpdated', {
        detail: { organizationId, memberId }
      }));

      toast({
        title: "Sucesso",
        description: "Horários de trabalho salvos com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os horários de trabalho.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHour = (dayOfWeek: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours(prev => prev.map(hour => 
      hour.day_of_week === dayOfWeek ? { ...hour, [field]: value } : hour
    ));
  };

  if (loading) {
    return <div className="p-4">Carregando horários...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const hour = workingHours.find(h => h.day_of_week === day.value);
          if (!hour) return null;

          return (
            <div key={day.value} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-24">
                <Switch
                  checked={hour.is_active}
                  onCheckedChange={(checked) => 
                    updateWorkingHour(day.value, 'is_active', checked)
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">{day.label}</Label>
              </div>
              {hour.is_active && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">De:</Label>
                    <Input
                      type="time"
                      value={hour.start_time}
                      onChange={(e) => 
                        updateWorkingHour(day.value, 'start_time', e.target.value)
                      }
                      className="w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Até:</Label>
                    <Input
                      type="time"
                      value={hour.end_time}
                      onChange={(e) => 
                        updateWorkingHour(day.value, 'end_time', e.target.value)
                      }
                      className="w-28"
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Horários'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}