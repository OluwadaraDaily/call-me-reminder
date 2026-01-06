'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/signup-form';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return <SignupForm />;
}
