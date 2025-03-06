import { AuthLayout } from '@/components/layout/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function SignupPage() {
  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Join Horizon today and connect with the world."
    >
      <RegisterForm />
    </AuthLayout>
  );
} 