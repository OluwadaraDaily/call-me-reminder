'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { passwordResetConfirmSchema, PasswordResetConfirmFormData } from '../lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PasswordResetConfirmForm() {
  const { confirmPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const form = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: PasswordResetConfirmFormData) => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await confirmPasswordReset(token, data.password);

      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Password reset failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please request a new password reset link.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full">
                Request new reset link
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-2">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
        <CardDescription>
          Choose a strong password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Must be at least 8 characters with uppercase, lowercase, and a digit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
