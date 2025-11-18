import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MemberScheduleBlocksProps {
  member: {
    id: string;
    user_id: string;
    profiles?: {
      display_name?: string;
    };
  };
  organizationId: string;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

interface ScheduleBlock {
  id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_all_day: boolean;
}

export function MemberScheduleBlocks({ member, organizationId, dialogOpen, onDialogOpenChange }: MemberScheduleBlocksProps) {
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBlock, setNewBlock] = useState({
    date: new Date(),
    startTime: '',
    endTime: '',
    reason: '',
    isAllDay: false,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('member_schedule_blocks')
        .select('*')
        .eq('member_id', member.id)
        .eq('organization_id', organizationId)
        .order('block_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar bloqueios:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar bloqueios de agenda.",
          variant: "destructive",
        });
        return;
      }

      setBlocks(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar bloqueios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addBlock = async () => {
    if (!newBlock.date) {
      toast({
        title: "Erro",
        description: "Selecione uma data para o bloqueio.",
        variant: "destructive",
      });
      return;
    }

    if (!newBlock.isAllDay && (!newBlock.startTime || !newBlock.endTime)) {
      toast({
        title: "Erro",
        description: "Informe o horário de início e fim para bloqueios parciais.",
        variant: "destructive",
      });
      return;
    }

    if (!newBlock.isAllDay && newBlock.startTime >= newBlock.endTime) {
      toast({
        title: "Erro",
        description: "O horário de início deve ser anterior ao horário de fim.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('member_schedule_blocks')
        .insert({
          organization_id: organizationId,
          member_id: member.id,
          block_date: format(newBlock.date, 'yyyy-MM-dd'),
          start_time: newBlock.isAllDay ? null : newBlock.startTime,
          end_time: newBlock.isAllDay ? null : newBlock.endTime,
          reason: newBlock.reason || null,
          is_all_day: newBlock.isAllDay,
        });

      if (error) {
        console.error('Erro ao criar bloqueio:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar bloqueio de agenda.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Bloqueio de agenda criado com sucesso!",
        variant: "success",
      });

      // Reset form
      setNewBlock({
        date: new Date(),
        startTime: '',
        endTime: '',
        reason: '',
        isAllDay: false,
      });

      fetchBlocks();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar bloqueio.",
        variant: "destructive",
      });
    }
  };

  const removeBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('member_schedule_blocks')
        .delete()
        .eq('id', blockId);

      if (error) {
        console.error('Erro ao remover bloqueio:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover bloqueio de agenda.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Bloqueio removido com sucesso!",
        variant: "success",
      });

      fetchBlocks();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao remover bloqueio.",
        variant: "destructive",
      });
    }
  };

  const formatBlockDisplay = (block: ScheduleBlock) => {
    // Parse the date as a local date to avoid timezone issues
    const [year, month, day] = block.block_date.split('-').map(Number);
    const date = format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
    if (block.is_all_day) {
      return `${date} - Dia inteiro`;
    }
    return `${date} - ${block.start_time} às ${block.end_time}`;
  };

  // Use external control if provided, otherwise use internal state
  const isOpen = dialogOpen !== undefined ? dialogOpen : internalDialogOpen;
  const setIsOpen = onDialogOpenChange || setInternalDialogOpen;

  useEffect(() => {
    if (isOpen) {
      fetchBlocks();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only render trigger if not externally controlled */}
      {dialogOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <X className="h-4 w-4" />
            Bloqueios
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5" />
            Bloqueios de Agenda - {member.profiles?.display_name || 'Colaborador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para adicionar novo bloqueio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Novo Bloqueio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newBlock.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBlock.date ? format(newBlock.date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newBlock.date}
                        onSelect={(date) => {
                          setNewBlock({ ...newBlock, date: date || new Date() });
                          setCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Dia inteiro */}
                <div className="space-y-2">
                  <Label htmlFor="allDay">Tipo de Bloqueio</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allDay"
                      checked={newBlock.isAllDay}
                      onCheckedChange={(checked) => setNewBlock({ ...newBlock, isAllDay: checked })}
                    />
                    <Label htmlFor="allDay" className="text-sm">
                      Dia inteiro
                    </Label>
                  </div>
                </div>
              </div>

              {/* Horários (apenas se não for dia inteiro) */}
              {!newBlock.isAllDay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Horário de Início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Horário de Fim</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Férias, Atendimento externo, Reunião..."
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  rows={2}
                />
              </div>

              <Button onClick={addBlock} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Bloqueio
              </Button>
            </CardContent>
          </Card>

          {/* Lista de bloqueios existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bloqueios Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Carregando bloqueios...</p>
                </div>
              ) : blocks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum bloqueio de agenda configurado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={block.is_all_day ? "destructive" : "secondary"}>
                            {formatBlockDisplay(block)}
                          </Badge>
                        </div>
                        {block.reason && (
                          <p className="text-sm text-muted-foreground">{block.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlock(block.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}