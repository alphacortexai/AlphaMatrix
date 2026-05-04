import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || !userProfile) {
    navigate('/login');
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(userProfile.role)) {
    navigate('/unauthorized');
    return null;
  }

  return <>{children}</>;
}
