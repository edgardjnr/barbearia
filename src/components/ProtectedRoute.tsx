import { usePermissions, ModuleName } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule: ModuleName;
}

export const ProtectedRoute = ({ children, requiredModule }: ProtectedRouteProps) => {
  const { canAccessModule, loading } = usePermissions();
  const { userRole, loading: authLoading } = useAuth();

  // Show loading while checking permissions
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Owners always have access
  if (userRole === 'owner') {
    return <>{children}</>;
  }

  // Show access denied if user doesn't have permission
  if (!canAccessModule(requiredModule)) {
    return <AccessDenied module={requiredModule} />;
  }

  // Render children if user has permission
  return <>{children}</>;
};