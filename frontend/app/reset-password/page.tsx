import { Suspense } from 'react';
import { PasswordResetConfirmForm } from '@/components/password-reset-confirm-form';
import { Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <PasswordResetConfirmForm />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
