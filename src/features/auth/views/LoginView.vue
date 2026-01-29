<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
      <!-- Logo -->
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span class="text-2xl font-bold text-white">Q</span>
          </div>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">Welcome back</h2>
        <p class="mt-2 text-gray-600">Sign in to your account</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="you@example.com"
              :error="errors.email"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••"
              :error="errors.password"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <router-link
            to="/forgot-password"
            class="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Forgot password?
          </router-link>
        </div>

        <div>
          <Button
            type="submit"
            :loading="isLoading"
            :disabled="isLoading"
            variant="gradient"
            class="w-full"
            size="lg"
          >
            Sign in
          </Button>
        </div>
      </form>

      <!-- Demo Credentials -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
        <p class="text-xs text-blue-700">Email: student@quizsphere.com</p>
        <p class="text-xs text-blue-700">Password: password123</p>
      </div>

      <!-- Sign Up Link -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <router-link
            to="/register"
            class="font-medium text-blue-600 hover:text-blue-500 ml-1"
          >
            Sign up
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';

const router = useRouter();
const { login, isLoading } = useAuth();

const form = reactive({
  email: '',
  password: '',
  remember: false,
});

const errors = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  // Clear errors
  errors.email = '';
  errors.password = '';

  // Simple validation
  if (!form.email) {
    errors.email = 'Email is required';
    return;
  }

  if (!form.password) {
    errors.password = 'Password is required';
    return;
  }

  // Call login
  const result = await login(form.email, form.password);
  
  if (result.success) {
    // Redirect to dashboard
    router.push('/');
  }
};
</script>