import { SignIn } from '@clerk/nextjs';
import { isTestingMode } from '../../../lib/test-auth';
import { redirect } from 'next/navigation';

export default function SignInPage() {
  // In testing mode, automatically redirect to dashboard
  if (isTestingMode()) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-mobile-xl font-bold text-gray-900 mb-2">
            Explosives Inventory
          </h1>
          <p className="text-mobile-base text-gray-600">
            Field operations management system
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                card: "shadow-2xl border-0",
                formButtonPrimary: "bg-gray-900 hover:bg-gray-800 text-white font-semibold min-h-touch",
                formFieldInput: "min-h-touch text-mobile-base border-gray-300",
                footerActionLink: "text-gray-900 hover:text-gray-700",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}