'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          System Administration
        </h1>
        <p className="text-gray-600">
          Manage users, system settings, and explosives inventory configuration.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <nav className="flex border-b border-gray-200">
          {[
            { id: 'users', label: 'User Management', icon: '👥' },
            { id: 'magazines', label: 'Magazine Setup', icon: '🏭' },
            { id: 'products', label: 'Product Catalog', icon: '📦' },
            { id: 'plans', label: 'Response Plans', icon: '📋' },
            { id: 'system', label: 'System Settings', icon: '⚙️' },
            { id: 'backup', label: 'Backup & Recovery', icon: '💾' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors min-h-[56px] ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]">
                  Add New User
                </button>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">1</div>
                  <div className="text-gray-600">Active Users</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">0</div>
                  <div className="text-yellow-600">Pending Approvals</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">0</div>
                  <div className="text-red-600">Expired Authorizations</div>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Authorization</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">Test Operator</div>
                          <div className="text-sm text-gray-600">test@explosives.local</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">Administrator</td>
                      <td className="px-4 py-3 text-sm text-green-600">Valid (Testing)</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'magazines' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Magazine Configuration</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]">
                  Add New Magazine
                </button>
              </div>

              <div className="text-center py-12 text-gray-600">
                No magazines configured yet. Add your first storage magazine to get started.
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Catalog</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]">
                  Add New Product
                </button>
              </div>

              <div className="text-center py-12 text-gray-600">
                No products configured yet. Add explosive products to your catalog to start tracking inventory.
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Safety Settings</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Require authorization verification for all transactions</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Enable Emergency Stop functionality</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Enforce magazine capacity limits</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Audit Settings</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Log all inventory transactions</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Enable monthly reconciliation alerts</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" />
                      <span>Export audit logs automatically</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Response Plans Management</h2>
              <p className="text-gray-600 mb-6">
                Upload and manage emergency response plans for site safety. These plans will be accessible through the Response Plans dropdown in the header.
              </p>
              
              <div className="space-y-6">
                {/* Fire Safety Plan */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🔥</span>
                    <h3 className="font-semibold text-gray-900">Fire Safety Plan</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PDF Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300">
                      <div className="text-center text-gray-500">
                        <p className="text-sm font-medium">Current Status:</p>
                        <p className="text-xs text-gray-600 mt-1">No fire safety plan uploaded</p>
                        <button className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium">
                          Upload Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Plan */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🔒</span>
                    <h3 className="font-semibold text-gray-900">Security Plan</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PDF Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300">
                      <div className="text-center text-gray-500">
                        <p className="text-sm font-medium">Current Status:</p>
                        <p className="text-xs text-gray-600 mt-1">No security plan uploaded</p>
                        <button className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium">
                          Upload Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ERAP Plan */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🚨</span>
                    <h3 className="font-semibold text-gray-900">ERAP (Emergency Response Assistance Plan)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PDF Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300">
                      <div className="text-center text-gray-500">
                        <p className="text-sm font-medium">Current Status:</p>
                        <p className="text-xs text-gray-600 mt-1">No ERAP plan uploaded</p>
                        <button className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium">
                          Upload Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Instructions */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📝 Upload Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• PDF format only, maximum file size 10MB</li>
                  <li>• Plans should be current and approved by site management</li>
                  <li>• Uploaded plans will be immediately accessible to all authorized users</li>
                  <li>• Previous versions will be archived automatically</li>
                  <li>• Contact IT support for bulk uploads or technical issues</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Backup & Recovery</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Database Backup</h3>
                  <p className="text-gray-600 mb-4">
                    Create a backup of all inventory data and transactions.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]">
                    Create Backup
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">System Restore</h3>
                  <p className="text-gray-600 mb-4">
                    Restore system from a previous backup file.
                  </p>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors min-h-[44px]">
                    Restore Backup
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Backups</h3>
                <div className="text-center py-8 text-gray-600">
                  No backups created yet. Create your first backup above.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🟢</div>
            <div className="font-medium text-gray-900">Database</div>
            <div className="text-sm text-green-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🟢</div>
            <div className="font-medium text-gray-900">Authentication</div>
            <div className="text-sm text-green-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🟡</div>
            <div className="font-medium text-gray-900">Testing Mode</div>
            <div className="text-sm text-yellow-600">Enabled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🟢</div>
            <div className="font-medium text-gray-900">API Status</div>
            <div className="text-sm text-green-600">Operational</div>
          </div>
        </div>
      </div>
    </div>
  );
}