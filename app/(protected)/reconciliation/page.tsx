'use client';

import { useState } from 'react';
import { ActionButton } from '../../../components/ui/action-button';
import { StatusBadge } from '../../../components/ui/status-badge';
import { MagazineSelector } from '../../../components/ui/magazine-selector';
import { ProductSelector } from '../../../components/ui/product-selector';

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState('conduct');
  const [selectedMagazine, setSelectedMagazine] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [physicalCount, setPhysicalCount] = useState('');
  const [varianceReason, setVarianceReason] = useState('');

  // Mock data for testing
  const mockReconciliations = [
    {
      id: 1,
      date: '2024-01-15',
      magazine: 'M-01',
      product: 'PETN Boosters',
      systemCount: 150,
      physicalCount: 148,
      variance: -2,
      status: 'pending',
      reason: 'Minor count discrepancy'
    },
    {
      id: 2,
      date: '2024-01-15',
      magazine: 'M-02',
      product: 'Detonating Cord',
      systemCount: 500,
      physicalCount: 500,
      variance: 0,
      status: 'resolved',
      reason: null
    }
  ];

  const mockMagazines = [
    { id: 1, code: 'M-01', name: 'Main Storage', location: 'Site A', max_net_explosive_weight_kg: 1000, current_net_weight_kg: 750, current_capacity_percentage: 75 }
  ];

  const mockProducts = [
    { id: 1, name: 'PETN Boosters', un_number: 'UN 0241', compatibility_group: 'D', explosive_type: 'E/I', unit: 'kg', net_explosive_weight_per_unit_kg: 0.5 }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Reconciliation submitted:', {
      magazine: selectedMagazine,
      product: selectedProduct,
      physicalCount,
      varianceReason
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Reconciliation</h1>
            <p className="text-gray-600 mt-1">Physical counts vs system records</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <StatusBadge variant="warning" size="lg">
              January 2024 Reconciliation
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <nav className="flex border-b border-gray-200">
          {[
            { id: 'conduct', label: 'Conduct Reconciliation', icon: '📊' },
            { id: 'review', label: 'Review Results', icon: '🔍' },
            { id: 'resolve', label: 'Resolve Variances', icon: '⚖️' },
            { id: 'history', label: 'History', icon: '📋' }
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

        <div className="p-6">
          {activeTab === 'conduct' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Physical Count Entry</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Magazine Selection */}
                <MagazineSelector
                  label="Select Magazine"
                  magazines={mockMagazines}
                  value={selectedMagazine}
                  onChange={setSelectedMagazine}
                  showCapacity={true}
                />

                {/* Product Selection */}
                <ProductSelector
                  label="Select Product"
                  products={mockProducts}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  showCompatibility={true}
                />

                {selectedMagazine && selectedProduct && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">System Record</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          System Count
                        </label>
                        <div className="text-2xl font-bold text-blue-600">150 kg</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Transaction
                        </label>
                        <div className="text-sm text-gray-600">Issue - Jan 10, 2024</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Reconciliation
                        </label>
                        <div className="text-sm text-gray-600">Dec 15, 2023</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Physical Count Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Physical Count *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={physicalCount}
                    onChange={(e) => setPhysicalCount(e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
                    placeholder="Enter physical count"
                    required
                  />
                </div>

                {/* Variance Display */}
                {physicalCount && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Variance Calculation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">System Count</div>
                        <div className="text-xl font-bold text-gray-900">150 kg</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Physical Count</div>
                        <div className="text-xl font-bold text-gray-900">{physicalCount} kg</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Variance</div>
                        <div className={`text-xl font-bold ${
                          (parseFloat(physicalCount) - 150) === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(parseFloat(physicalCount) - 150).toFixed(2)} kg
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variance Reason */}
                {physicalCount && (parseFloat(physicalCount) - 150) !== 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Variance Reason *
                    </label>
                    <textarea
                      value={varianceReason}
                      onChange={(e) => setVarianceReason(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[100px]"
                      placeholder="Explain the reason for the variance..."
                      required
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <ActionButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!selectedMagazine || !selectedProduct || !physicalCount}
                  >
                    Submit Reconciliation
                  </ActionButton>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'review' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reconciliation Results</h2>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">85%</div>
                  <div className="text-green-600">Items Matched</div>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">3</div>
                  <div className="text-yellow-600">Pending Review</div>
                </div>
                <div className="bg-red-50 p-6 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">2</div>
                  <div className="text-red-600">Variances Found</div>
                </div>
              </div>

              {/* Results Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Magazine</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Product</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">System</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Physical</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Variance</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReconciliations.map((rec, index) => (
                      <tr key={rec.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900">{rec.magazine}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{rec.product}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">{rec.systemCount}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">{rec.physicalCount}</td>
                        <td className={`px-6 py-4 text-sm text-right font-medium ${
                          rec.variance === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {rec.variance > 0 ? '+' : ''}{rec.variance}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge 
                            variant={rec.status === 'resolved' ? 'success' : 'warning'} 
                            size="sm"
                          >
                            {rec.status}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'resolve' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Resolve Variances</h2>
              <div className="text-center py-12 text-gray-600">
                Variance resolution interface would be implemented here.
                Managers can approve adjustments or request re-counts.
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reconciliation History</h2>
              <div className="text-center py-12 text-gray-600">
                Historical reconciliation records would be displayed here.
                Previous months, trends, and resolution tracking.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}