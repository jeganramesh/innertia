/**
 * Login Page Component
 * Apple-like minimal design with clean aesthetics
 */

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import type { LoginInput } from '../../services/auth';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, error, login, clearError } = useAuth();
  
  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/student" replace />;
  }
  
  const handleSubmit = async (data: LoginInput) => {
    await login(data);
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="py-8 px-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Innertia Admin
          </h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="text-center mb-10 animate-fade-in">
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              Sign in
            </h2>
            <p className="text-gray-500">
              Use your institutional email to continue
            </p>
          </div>
          
          {/* Login Form */}
          <div className="animate-fade-up">
            <LoginForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center text-sm text-gray-400">
              <a href="#" className="hover:text-gray-600 transition-colors">
                Help
              </a>
              <span className="mx-3">·</span>
              <a href="#" className="hover:text-gray-600 transition-colors">
                Privacy
              </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
