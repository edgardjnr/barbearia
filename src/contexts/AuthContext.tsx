// AuthContext - Gerencia autenticação e estado da organização - Atualizado
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'owner' | 'admin' | 'manager' | 'employee';

export interface UserOrganization {
  organization_id: string;
  organization_name: string;
  organization_description?: string;
  user_role: UserRole;
  member_status: string;
  joined_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  theme_preference?: string;
  current_organization_id?: string;
  is_master?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  settings?: any;
  owner_id: string;
  created_at: string;
  updated_at: string;
  whatsapp_instance_name?: string;
  whatsapp_apikey?: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  joined_at?: string;
  status: 'active' | 'invited' | 'suspended';
  profiles?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  userRole: UserRole | null;
  organizationMembers: OrganizationMember[];
  userOrganizations: UserOrganization[];
  loading: boolean;
  isClient: boolean;
  hasPermission: (requiredRole: UserRole) => boolean;
  canManageUsers: () => boolean;
  canManageData: () => boolean;
  canViewData: () => boolean;
  refreshUserData: () => Promise<void>;
  createOrganization: (data: Partial<Organization>) => Promise<{ data?: Organization; error?: any }>;
  updateOrganization: (data: Partial<Organization>) => Promise<{ error?: any }>;
  switchOrganization: (organizationId: string) => Promise<{ error?: any }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error?: any }>;
  removeUser: (userId: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // More defensive error handling
    console.error('useAuth called outside of AuthProvider context');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const roleHierarchy: Record<UserRole, number> = {
  employee: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Set up auth state listener
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Handle password recovery events
        if (event === 'PASSWORD_RECOVERY') {
          if (window.location.pathname !== '/reset-password') {
            window.location.href = '/reset-password' + window.location.hash + window.location.search;
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setInitialized(true);
        
        if (session?.user) {
          // Check if user is a client based on metadata
          const userType = session.user.user_metadata?.user_type;
          setIsClient(userType === 'client');
          
          // Defer the data loading to avoid blocking the auth callback
          setTimeout(() => {
            if (mounted) {
              loadUserData(session.user.id);
            }
          }, 0);
        } else {
          // Clear all data when user logs out
          setUserProfile(null);
          setOrganization(null);
          setUserRole(null);
          setOrganizationMembers([]);
          setIsClient(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
      
      if (session?.user) {
        // Check if user is a client based on metadata
        const userType = session.user.user_metadata?.user_type;
        setIsClient(userType === 'client');
        
        loadUserData(session.user.id);
      } else {
        setIsClient(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setUserProfile(profile as UserProfile);

      // Load all user organizations
      await loadUserOrganizations(profile as UserProfile);

      // Load current organization membership (using get_user_organization_id function)
      const { data: currentOrgId } = await supabase.rpc('get_user_organization_id');

      // For master users, handle organization loading differently
      if (profile?.is_master && currentOrgId) {
        console.log('Loading organization for master user:', currentOrgId);
        
        // Load organization directly
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', currentOrgId)
          .single();

        if (orgError) {
          console.warn('Error loading organization for master user:', orgError);
          setOrganization(null);
          setUserRole(null);
        } else {
          console.log('Setting organization data for master user:', orgData);
          setOrganization(orgData as Organization);
          setUserRole('owner'); // Master users have owner permissions
          
          // Load organization members
          loadOrganizationMembers(currentOrgId);
        }
      } else {
        // Load organization membership for regular users
        console.log('Loading organization membership for user:', userId);
        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select(`
            *,
            organizations(*)
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        console.log('Membership result:', { membership, membershipError });

        if (membershipError && membershipError.code !== 'PGRST116') {
          console.warn('Error loading organization membership:', membershipError);
          setOrganization(null);
          setUserRole(null);
          setOrganizationMembers([]);
        } else if (membership) {
          console.log('Setting organization data:', membership.organizations);
          setUserRole(membership.role);
          setOrganization(membership.organizations as Organization);

          // Load organization members if user has permission
          if (['admin', 'owner', 'manager'].includes(membership.role)) {
            loadOrganizationMembers(membership.organization_id);
          }
        } else {
          console.log('No membership found');
          setOrganization(null);
          setUserRole(null);
          setOrganizationMembers([]);
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrganizations = async (profile?: UserProfile) => {
    try {
      // Use passed profile or current userProfile
      const currentProfile = profile || userProfile;
      
      // For master users, load all organizations
      if (currentProfile?.is_master) {
        const { data: allOrganizations, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, description, created_at')
          .order('created_at', { ascending: true });

        if (orgError) throw orgError;

        // Transform to match expected format
        const transformedOrgs: UserOrganization[] = (allOrganizations || []).map(org => ({
          organization_id: org.id,
          organization_name: org.name,
          organization_description: org.description,
          user_role: 'owner' as UserRole,
          member_status: 'active',
          joined_at: org.created_at
        }));

        setUserOrganizations(transformedOrgs);
        return;
      }

      // For regular users, use the RPC function
      const { data: organizations, error } = await supabase.rpc('get_user_organizations');
      
      if (error) throw error;

      // Transform RPC results to match expected format
      const transformedRpcOrgs: UserOrganization[] = (organizations || []).map(org => ({
        organization_id: org.organization_id,
        organization_name: org.organization_name,
        organization_description: org.organization_description,
        user_role: org.user_role as UserRole,
        member_status: org.member_status,
        joined_at: org.joined_at
      }));

      setUserOrganizations(transformedRpcOrgs);
    } catch (error) {
      console.error('Error loading user organizations:', error);
      setUserOrganizations([]);
    }
  };

  const loadOrganizationMembers = async (organizationId: string) => {
    try {
      const { data: members, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles(*)
        `)
        .eq('organization_id', organizationId)
         .order('joined_at', { ascending: false });

      if (error) throw error;

      setOrganizationMembers((members || []) as unknown as OrganizationMember[]);
    } catch (error) {
      console.error('Error loading organization members:', error);
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userRole) return false;
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const canManageUsers = (): boolean => {
    return hasPermission('manager');
  };

  const canManageData = (): boolean => {
    return hasPermission('employee');
  };

  const canViewData = (): boolean => {
    return hasPermission('employee');
  };

  const refreshUserData = async (): Promise<void> => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const createOrganization = async (data: Partial<Organization>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name || '',
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email,
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner to organization_members
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        });

      if (memberError) throw memberError;

      // Try to update user profile if it doesn't exist, but don't fail if it does
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: true
        });

      // Don't throw error if profile already exists
      if (profileError && profileError.code !== '23505') {
        console.warn('Profile upsert warning:', profileError);
      }

      // Update state immediately with the new organization and role
      setOrganization(org);
      setUserRole('owner');
      
      // Refresh user data to load organization members and other data
      await refreshUserData();

      return { data: org };
    } catch (error) {
      console.error('Error creating organization:', error);
      return { error };
    }
  };

  const updateOrganization = async (data: Partial<Organization>) => {
    if (!organization || !hasPermission('admin')) {
      return { error: 'Insufficient permissions' };
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', organization.id);

      if (error) throw error;

      await refreshUserData();
      return {};
    } catch (error) {
      console.error('Error updating organization:', error);
      return { error };
    }
  };

  // Função inviteUser removida - agora usamos create-user-and-invite edge function diretamente

  const updateUserRole = async (userId: string, role: UserRole) => {
    if (!organization || !canManageUsers()) {
      return { error: 'Insufficient permissions' };
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('organization_id', organization.id)
        .eq('user_id', userId);

      if (error) throw error;

      await refreshUserData();
      return {};
    } catch (error) {
      console.error('Error updating user role:', error);
      return { error };
    }
  };

  const removeUser = async (userId: string) => {
    if (!organization || !canManageUsers()) {
      return { error: 'Insufficient permissions' };
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organization.id)
        .eq('user_id', userId);

      if (error) throw error;

      await refreshUserData();
      return {};
    } catch (error) {
      console.error('Error removing user:', error);
      return { error };
    }
  };

  const switchOrganization = async (organizationId: string) => {
    try {
      const { data: success, error } = await supabase.rpc('switch_current_organization', {
        _organization_id: organizationId
      });

      if (error) throw error;
      if (!success) {
        return { error: 'You are not a member of this organization' };
      }

      // Refresh user data to update current organization
      await refreshUserData();
      return {};
    } catch (error) {
      console.error('Error switching organization:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    organization,
    userRole,
    organizationMembers,
    userOrganizations,
    loading,
    isClient,
    hasPermission,
    canManageUsers,
    canManageData,
    canViewData,
    refreshUserData,
    createOrganization,
    updateOrganization,
    switchOrganization,
    updateUserRole,
    removeUser,
  };

  // Don't render children until context is properly initialized
  if (!initialized && loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};