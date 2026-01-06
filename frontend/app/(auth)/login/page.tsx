'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/app/components/login-form';
import { useAuth } from '@/app/hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isLoading && isAuthenticated) {
  //     router.push('/dashboard');
  //   }
  // }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return <LoginForm />;
}
