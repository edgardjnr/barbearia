import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export const useCollaboratorSetup = () => {
  const { user, organization } = useAuth();

  // Function to save member services after they accept the invitation
  const saveMemberServices = async (memberId: string, serviceIds: string[]) => {
    if (!organization?.id) return;

    try {
      // Delete existing associations
      await supabase
        .from('member_services')
        .delete()
        .eq('organization_id', organization.id)
        .eq('member_id', memberId);

      // Insert new associations
      if (serviceIds.length > 0) {
        const memberServices = serviceIds.map(serviceId => ({
          organization_id: organization.id,
          member_id: memberId,
          service_id: serviceId,
        }));

        const { error } = await supabase
          .from('member_services')
          .insert(memberServices);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving member services:', error);
      throw error;
    }
  };

  // Function to save working hours after they accept the invitation
  const saveWorkingHours = async (memberId: string, workingHours: WorkingHour[]) => {
    if (!organization?.id) return;

    try {
      // Delete existing working hours
      await supabase
        .from('working_hours')
        .delete()
        .eq('organization_id', organization.id)
        .eq('member_id', memberId);

      // Insert new working hours (only active ones)
      const activeHours = workingHours
        .filter(hour => hour.is_active)
        .map(hour => ({
          organization_id: organization.id,
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
    } catch (error) {
      console.error('Error saving working hours:', error);
      throw error;
    }
  };

  return {
    saveMemberServices,
    saveWorkingHours,
  };
};