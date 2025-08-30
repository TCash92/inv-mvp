'use client';

import Link from 'next/link';
import { api } from '../../../lib/trpc';
import { ActionButton, StatusBadge } from '../../../components/ui';
import { formatDate } from '../../../lib/utils';

const transactionTypes = [
  {
    name: 'Receive',
    description: 'Add incoming explosives to magazine storage',
    href: '/transactions/receive',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    color: 'bg-green-600 hover:bg-green-700',
    textColor: 'text-green-700'
  },
  {
    name: 'Issue',
    description: 'Remove explosives from magazine for use',
    href: '/transactions/issue',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
    color: 'bg-blue-600 hover:bg-blue-700',
    textColor: 'text-blue-700'
  },
  {
    name: 'Transfer',
    description: 'Move explosives between magazines',
    href: '/transactions/transfer',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'bg-yellow-600 hover:bg-yellow-700',
    textColor: 'text-yellow-700'
  },
  {
    name: 'Adjust',
    description: 'Correct inventory quantities with justification',
    href: '/transactions/adjust',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      </svg>
    ),
    color: 'bg-purple-600 hover:bg-purple-700',
    textColor: 'text-purple-700'
  },
  {
    name: 'Destroy',
    description: 'Disposal of expired or damaged explosives',
    href: '/transactions/destroy',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    color: 'bg-red-600 hover:bg-red-700',
    textColor: 'text-red-700'
  }
];

export default function TransactionsPage() {
  // Fetch recent transactions for the activity feed
  const { data: recentTransactions, isLoading } = api.transactions.getAll.useQuery();

  // Calculate today's transaction stats - handle undefined/null recentTransactions using dashboard pattern
  const today = new Date().toDateString();
  const safeRecentTransactions = Array.isArray(recentTransactions) ? recentTransactions : [];
  const todayTransactions = safeRecentTransactions.filter(tx => 
    new Date(tx.transaction_date).toDateString() === today
  );

  const transactionCounts = todayTransactions.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Transactions</h1>
            <p className="text-gray-600 mt-1">Manage explosives movement and adjustments</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="text-sm text-gray-500">Today's Activity</div>
            <div className="text-2xl font-bold text-blue-600">{todayTransactions.length} transactions</div>
          </div>
        </div>
      </div>

      {/* Transaction Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transactionTypes.map((type) => (
          <Link key={type.name} href={type.href}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 border-l-4 border-gray-200 hover:border-blue-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${type.color} text-white group-hover:scale-110 transition-transform`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {type.name}
                      </h3>
                      {transactionCounts[type.name] && (
                        <div className="text-xs text-gray-500">
                          {transactionCounts[type.name]} today
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {type.description}
                  </p>
                  <ActionButton
                    size="md"
                    className="w-full"
                    variant="outline"
                  >
                    Start {type.name}
                  </ActionButton>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Receipts Today</p>
              <p className="text-2xl font-bold text-green-600">{transactionCounts['Receipt'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Issues Today</p>
              <p className="text-2xl font-bold text-blue-600">{transactionCounts['Issue'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transfers Today</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(transactionCounts['TransferOut'] || 0) + (transactionCounts['TransferIn'] || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Adjustments Today</p>
              <p className="text-2xl font-bold text-purple-600">
                {(transactionCounts['AdjustIncrease'] || 0) + (transactionCounts['AdjustDecrease'] || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/transactions/history" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : safeRecentTransactions.length > 0 ? (
            <div className="space-y-4">
              {safeRecentTransactions.slice(0, 8).map((transaction) => (
                <div key={transaction.id} className="flex items-center space-x-4">
                  <StatusBadge variant="transaction" type={transaction.type} size="sm">
                    {transaction.type}
                  </StatusBadge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {transaction.product_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {transaction.quantity} {transaction.unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatDate(transaction.transaction_date)}</span>
                      {transaction.magazine_from_name && (
                        <>
                          <span>•</span>
                          <span>From: {transaction.magazine_from_code}</span>
                        </>
                      )}
                      {transaction.magazine_to_name && (
                        <>
                          <span>•</span>
                          <span>To: {transaction.magazine_to_code}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-1">No recent activity</p>
              <p className="text-gray-500">Start your first transaction to see activity here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}