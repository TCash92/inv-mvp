import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-mobile-lg font-bold text-gray-900">
                Explosives Inventory
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-mobile-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="touch-target-large bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors">
                Receive
              </button>
              <button className="touch-target-large bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Issue
              </button>
              <button className="touch-target-large bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors">
                Transfer
              </button>
              <button className="touch-target-large bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
                Adjust
              </button>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-mobile-base font-semibold text-gray-900 mb-2">
                Current Stock
              </h3>
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Items in inventory</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-mobile-base font-semibold text-gray-900 mb-2">
                Recent Transactions
              </h3>
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600">Today</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-mobile-base font-semibold text-gray-900 mb-2">
                Pending Reconciliations
              </h3>
              <p className="text-2xl font-bold text-orange-600">0</p>
              <p className="text-sm text-gray-600">Need attention</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-mobile-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center">
                No recent activity. Start by receiving your first inventory items.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}