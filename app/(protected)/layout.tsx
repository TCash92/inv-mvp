import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { MobileNav } from '../../components/layout/mobile-nav';
import { ResponsePlansHeader } from '../../components/layout/response-plans-header';
import { isTestingMode, getMockAuth } from '../../lib/test-auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string | null = null;
  let user: any = null;

  if (isTestingMode()) {
    // Use mock authentication in testing mode
    const mockAuth = getMockAuth();
    userId = mockAuth?.userId || null;
    user = mockAuth?.user || null;
  } else {
    // Use real Clerk authentication in production
    const authResult = await auth();
    userId = authResult.userId;
    user = await currentUser();
    
    if (!userId) {
      redirect('/sign-in');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <MobileNav />
              
              <div className="ml-4 lg:ml-0">
                <h1 className="text-mobile-lg font-bold text-gray-900">
                  Explosives Inventory
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user?.firstName || user?.email || 'Test User'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Response Plans Dropdown - Temporarily disabled for testing */}
              {/* <ResponsePlansHeader /> */}
              
              {/* User Menu */}
              {isTestingMode() ? (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0) || 'T'}
                </div>
              ) : (
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}