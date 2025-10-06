
import { useAuth } from '../../hooks/useAuth';

export function VisibleFor({ 
  roles, 
  children 
}: { 
  roles: Array<'admin' | 'monitor'>; 
  children: React.ReactNode 
}) {
  const { user } = useAuth();
  if (!user) return null;
  return roles.includes(user.role as 'admin' | 'monitor') ? <>{children}</> : null;
}