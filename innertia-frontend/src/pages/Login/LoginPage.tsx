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
            Innertia
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
          
          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-gray-900 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-gray-900 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>© 2024 Innertia Placement Shell</span>
            <div className="space-x-4">
              <a href="#" className="hover:text-gray-600 transition-colors">
                Help
              </a>
              <a href="#" className="hover:text-gray-600 transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
