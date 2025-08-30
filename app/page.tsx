import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isTestingMode, getMockAuth } from '../lib/test-auth';

export default async function HomePage() {
  let userId: string | null = null;

  if (isTestingMode()) {
    // Use mock authentication in testing mode
    const mockAuth = getMockAuth();
    userId = mockAuth?.userId || null;
  } else {
    // Use real Clerk authentication in production
    const authResult = await auth();
    userId = authResult.userId;
  }
  
  if (userId) {
    redirect('/dashboard');
  } else {
    redirect('/sign-in');
  }
}