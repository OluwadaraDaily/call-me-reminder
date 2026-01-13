'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect to the page they came from, or dashboard as fallback
      const from = searchParams.get('from') || '/dashboard';
      router.replace(from);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  return <LoginForm />;
}
