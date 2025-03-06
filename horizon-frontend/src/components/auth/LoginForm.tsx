import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof formSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      await login(data);
      navigate('/');
      toast.success('Welcome back!');
    } catch (error) {
      // Error is handled by the auth store
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {authError}
          </div>
        )}
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="johndoe@gmail.com" 
                    className="pl-10 bg-background/50 border-border/50 rounded-lg h-12"
                    {...field} 
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-primary hover:underline"
                >
                  Forgot Password
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-background/50 border-border/50 rounded-lg h-12"
                    {...field} 
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center space-x-2 my-4">
          <input
            type="checkbox"
            id="remember"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/80"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground">
            Keep me logged in
          </label>
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-lg transition-all duration-300 font-medium text-base" 
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
} 