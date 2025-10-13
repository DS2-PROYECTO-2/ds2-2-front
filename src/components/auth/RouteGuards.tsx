
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function RequireRoles({ 
  roles, 
  children 
}: { 
  roles: Array<'admin' | 'monitor'>; 
  children: React.ReactElement 
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return roles.includes(user.role as 'admin' | 'monitor') ? children : <Navigate to="/403" replace />;
}

export function RequireVerified({ 
  children 
}: { 
  children: React.ReactElement 
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.is_verified ? children : <Navigate to="/pendiente-verificacion" replace />;
}