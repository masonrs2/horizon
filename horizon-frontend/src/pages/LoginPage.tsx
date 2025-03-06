import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout 
      title="Sign in to Horizon" 
      subtitle="Welcome back! Please enter your details."
    >
      <LoginForm />
    </AuthLayout>
  );
} 