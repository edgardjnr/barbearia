import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ModuleName = 'dashboard' | 'agenda' | 'clients' | 'services' | 'reports' | 'loyalty' | 'reviews' | 'users' | 'settings' | 'messages';
export type Operation = 'create' | 'read' | 'update' | 'delete';

interface Permission {
  module: ModuleName;
  operation: Operation;
  granted: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, organization, userRole } = useAuth();

  useEffect(() => {
    if (!user || !organization) {
      setLoading(false);
      return;
    }

    // Owners have all permissions
    if (userRole === 'owner') {
      setPermissions([]);
      setLoading(false);
      return;
    }

    fetchUserPermissions();
  }, [user, organization, userRole]);

  const fetchUserPermissions = async () => {
    if (!user || !organization) return;

    setLoading(true);
    try {
      // Get member ID from organization_members
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .single();

      if (memberError) {
        console.error('Error fetching member:', memberError);
        setLoading(false);
        return;
      }

      // Get permissions for this member
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('member_permissions')
        .select('module, operation, granted')
        .eq('member_id', memberData.id)
        .eq('organization_id', organization.id);

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        setLoading(false);
        return;
      }

      setPermissions(permissionsData || []);
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: ModuleName, operation: Operation = 'read'): boolean => {
    // Owners have all permissions
    if (userRole === 'owner') {
      return true;
    }

    // Find the specific permission
    const permission = permissions.find(p => p.module === module && p.operation === operation);
    return permission?.granted || false;
  };

  const canAccessModule = (module: ModuleName): boolean => {
    // Owners have access to all modules
    if (userRole === 'owner') {
      return true;
    }
    return hasPermission(module, 'read');
  };

  return {
    permissions,
    loading,
    hasPermission,
    canAccessModule,
    refreshPermissions: fetchUserPermissions
  };
};