import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, X } from "lucide-react";

interface CompleteAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string) => void;
  appointmentDetails: {
    clientName: string;
    serviceName: string;
    time: string;
  } | null;
  loading?: boolean;
}

export const CompleteAppointmentDialog = ({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  appointmentDetails,
  loading = false 
}: CompleteAppointmentDialogProps) => {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes(""); // Reset notes for next use
  };

  const handleCancel = () => {
    setNotes(""); // Reset notes when canceling
    onOpenChange(false);
  };

  if (!appointmentDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Concluir Atendimento
          </DialogTitle>
          <DialogDescription>
            Finalize o atendimento e adicione observações sobre o serviço realizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Cliente:</span>
              <span className="font-medium">{appointmentDetails.clientName}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Serviço:</span>
              <span>{appointmentDetails.serviceName}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Horário:</span>
              <span>{appointmentDetails.time}</span>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="service-notes">
              Observações do Atendimento
            </Label>
            <Textarea
              id="service-notes"
              placeholder="Descreva como foi o atendimento, produtos utilizados, orientações dadas ao cliente, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Essas observações aparecerão no histórico do cliente
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {loading ? "Concluindo..." : "Concluir Atendimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};