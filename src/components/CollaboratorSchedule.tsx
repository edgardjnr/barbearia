import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Calendar } from "lucide-react";
import { WorkingHoursManager } from "./WorkingHoursManager";
import { useAuth } from "@/contexts/AuthContext";

interface CollaboratorScheduleProps {
  member: {
    id: string;
    user_id: string;
    role: string;
    profiles?: {
      display_name?: string;
    };
  };
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function CollaboratorSchedule({ member, dialogOpen, onDialogOpenChange }: CollaboratorScheduleProps) {
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const { organization } = useAuth();

  // Use external control if provided, otherwise use internal state
  const isOpen = dialogOpen !== undefined ? dialogOpen : internalDialogOpen;
  const setIsOpen = onDialogOpenChange || setInternalDialogOpen;

  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only render trigger if not externally controlled */}
      {dialogOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horários de Atendimento - {member.profiles?.display_name || 'Colaborador'}
          </DialogTitle>
        </DialogHeader>
        <WorkingHoursManager 
          memberId={member.id} 
          organizationId={organization.id}
        />
      </DialogContent>
    </Dialog>
  );
}