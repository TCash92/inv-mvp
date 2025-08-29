'use client';

import { api } from '../../lib/trpc';
import Link from 'next/link';

export function DashboardContent() {
  // Fetch data using tRPC
  const { data: currentStock, isLoading: stockLoading } = api.stock.getCurrentStock.useQuery();
  const { data: recentTransactions, isLoading: transactionsLoading } = api.transactions.getAll.useQuery();
  const { data: unresolvedReconciliations, isLoading: reconciliationLoading } = api.reconciliation.getUnresolved.useQuery();

  // Calculate stats
  const totalStockItems = currentStock?.reduce((sum, item) => sum + item.current_quantity, 0) || 0;
  const todayTransactions = recentTransactions?.filter(
    tx => new Date(tx.transaction_date).toDateString() === new Date().toDateString()
  ).length || 0;
  const pendingReconciliations = unresolvedReconciliations?.length || 0;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-mobile-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/transactions/receive">
            <button className="touch-target-large bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors w-full">
              Receive
            </button>
          </Link>
          <Link href="/transactions/issue">
            <button className="touch-target-large bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors w-full">
              Issue
            </button>
          </Link>
          <Link href="/transactions/transfer">
            <button className="touch-target-large bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors w-full">
              Transfer
            </button>
          </Link>
          <Link href="/transactions/adjust">
            <button className="touch-target-large bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors w-full">
              Adjust
            </button>
          </Link>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-mobile-base font-semibold text-gray-900 mb-2">
            Current Stock
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {stockLoading ? '...' : totalStockItems}
          </p>
          <p className="text-sm text-gray-600">Items in inventory</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-mobile-base font-semibold text-gray-900 mb-2">
            Recent Transactions
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {transactionsLoading ? '...' : todayTransactions}
          </p>
          <p className="text-sm text-gray-600">Today</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-mobile-base font-semibold text-gray-900 mb-2">
            Pending Reconciliations
          </h3>
          <p className="text-2xl font-bold text-orange-600">
            {reconciliationLoading ? '...' : pendingReconciliations}
          </p>
          <p className="text-sm text-gray-600">Need attention</p>
        </div>
      </div>

      {/* Current Stock Overview */}
      {currentStock && currentStock.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-mobile-lg font-semibold text-gray-900">
              Current Stock by Magazine
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Magazine</th>
                    <th className="text-left py-2 font-medium">Product</th>
                    <th className="text-left py-2 font-medium">UN Number</th>
                    <th className="text-right py-2 font-medium">Quantity</th>
                    <th className="text-right py-2 font-medium">Net Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStock.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{item.magazine_code}</div>
                          <div className="text-gray-500 text-xs">{item.magazine_name}</div>
                        </div>
                      </td>
                      <td className="py-3">{item.product_name}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {item.un_number}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium">{item.current_quantity} {item.unit}</td>
                      <td className="py-3 text-right">{(item.net_explosive_weight || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentStock.length > 10 && (
                <div className="text-center mt-4">
                  <Link href="/stock" className="text-blue-600 hover:text-blue-800 font-medium">
                    View all stock items ({currentStock.length} total)
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-mobile-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          {transactionsLoading ? (
            <p className="text-gray-500 text-center">Loading recent transactions...</p>
          ) : recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        transaction.type === 'Receipt' ? 'bg-green-100 text-green-800' :
                        transaction.type === 'Issue' ? 'bg-blue-100 text-blue-800' :
                        transaction.type.includes('Transfer') ? 'bg-yellow-100 text-yellow-800' :
                        transaction.type.includes('Adjust') ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                      <span className="text-sm font-medium">{transaction.product_name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transaction.transaction_date).toLocaleDateString()} - 
                      Qty: {transaction.quantity}
                    </p>
                  </div>
                </div>
              ))}
              <div className="text-center mt-4">
                <Link href="/transactions/history" className="text-blue-600 hover:text-blue-800 font-medium">
                  View all transactions
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              No recent activity. Start by receiving your first inventory items.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}