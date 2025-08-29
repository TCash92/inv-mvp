import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { MobileNav } from '../../components/layout/mobile-nav';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
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
                  Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Emergency Stop Button */}
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold text-sm min-h-[44px] hidden sm:flex items-center">
                Emergency Stop
              </button>
              
              {/* User Menu */}
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  }
                }}
              />
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