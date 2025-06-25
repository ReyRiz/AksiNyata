import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading, hasAnyRole } = useAuth();

  // If still loading, show nothing or a spinner
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If logged in but not in allowed roles, redirect to dashboard
  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" />;
  }

  // Otherwise, show the protected component
  return children;
};

export default RoleRoute;
