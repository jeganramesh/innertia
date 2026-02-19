/**
 * Login Form Component - Apple-inspired design
 */

import React, { useState } from 'react';
import type { LoginInput } from '../../services/auth';

interface LoginFormProps {
  onSubmit: (data: LoginInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 text-sm text-system-red bg-system-red/10 rounded-apple border border-system-red/20">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-apple focus:outline-none focus:border-system-blue focus:ring-2 focus:ring-system-blue/20 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
          placeholder="your.email@institution.edu"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-apple focus:outline-none focus:border-system-blue focus:ring-2 focus:ring-system-blue/20 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-apple hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};

export default LoginForm;
