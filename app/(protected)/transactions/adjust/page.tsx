'use client';

import { useState } from 'react';
import { ActionButton } from '../../../../components/ui/action-button';
import { StatusBadge } from '../../../../components/ui/status-badge';
import { MagazineSelector } from '../../../../components/ui/magazine-selector';
import { ProductSelector } from '../../../../components/ui/product-selector';

export default function AdjustPage() {
  const [activeTab, setActiveTab] = useState('increase');
  const [selectedMagazine, setSelectedMagazine] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [authorizationNumber, setAuthorizationNumber] = useState('');

  // Mock data for testing
  const mockMagazines = [
    { id: 1, code: 'M-01', name: 'Main Storage', location: 'Site A', max_net_explosive_weight_kg: 1000, current_net_weight_kg: 750, current_capacity_percentage: 75 },
    { id: 2, code: 'M-02', name: 'Secondary Storage', location: 'Site B', max_net_explosive_weight_kg: 500, current_net_weight_kg: 200, current_capacity_percentage: 40 }
  ];

  const mockProducts = [
    { id: 1, name: 'PETN Boosters', un_number: 'UN 0241', compatibility_group: 'D', explosive_type: 'E/I', unit: 'kg', net_explosive_weight_per_unit_kg: 0.5 },
    { id: 2, name: 'Detonating Cord', un_number: 'UN 0065', compatibility_group: 'D', explosive_type: 'E/I', unit: 'm', net_explosive_weight_per_unit_kg: 0.02 }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Adjustment submitted:', {
      type: activeTab,
      magazine: selectedMagazine,
      product: selectedProduct,
      quantity: adjustmentQuantity,
      reason: adjustmentReason,
      authorization: authorizationNumber
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustment</h1>
            <p className="text-gray-600 mt-1">Adjust inventory levels with proper authorization</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <StatusBadge variant="warning" size="lg">
              Requires Authorization
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Adjustment Type Selection */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <nav className="flex border-b border-gray-200">
          {[
            { id: 'increase', label: 'Increase Inventory', icon: '📈', color: 'green' },
            { id: 'decrease', label: 'Decrease Inventory', icon: '📉', color: 'red' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors min-h-[56px] flex-1 ${
                activeTab === tab.id
                  ? `border-b-2 border-${tab.color}-500 bg-${tab.color}-50 text-${tab.color}-700`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Adjustment Type Info */}
            <div className={`p-4 rounded-lg ${
              activeTab === 'increase' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                activeTab === 'increase' ? 'text-green-800' : 'text-red-800'
              }`}>
                {activeTab === 'increase' ? 'Inventory Increase' : 'Inventory Decrease'}
              </h3>
              <p className={`text-sm ${
                activeTab === 'increase' ? 'text-green-700' : 'text-red-700'
              }`}>
                {activeTab === 'increase' 
                  ? 'Add inventory due to count corrections, found items, or other increases.'
                  : 'Remove inventory due to damage, expiration, theft, or other losses.'
                }
              </p>
            </div>

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

            {/* Current Stock Display */}
            {selectedMagazine && selectedProduct && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Current Stock Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock
                    </label>
                    <div className="text-2xl font-bold text-blue-600">125 kg</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Transaction
                    </label>
                    <div className="text-sm text-gray-600">Receipt - Jan 15, 2024</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Count
                    </label>
                    <div className="text-sm text-gray-600">Jan 01, 2024</div>
                  </div>
                </div>
              </div>
            )}

            {/* Adjustment Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adjustment Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
                placeholder="Enter adjustment amount"
                required
              />
              <p className="text-sm text-gray-600 mt-2">
                Enter the {activeTab === 'increase' ? 'amount to add' : 'amount to subtract'}
              </p>
            </div>

            {/* Adjustment Calculation */}
            {adjustmentQuantity && selectedProduct && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Adjustment Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Current Stock</div>
                    <div className="text-xl font-bold text-gray-900">125 kg</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Adjustment</div>
                    <div className={`text-xl font-bold ${
                      activeTab === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activeTab === 'increase' ? '+' : '-'}{adjustmentQuantity} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">New Stock Level</div>
                    <div className="text-xl font-bold text-blue-600">
                      {activeTab === 'increase' 
                        ? (125 + parseFloat(adjustmentQuantity || 0)).toFixed(2)
                        : (125 - parseFloat(adjustmentQuantity || 0)).toFixed(2)
                      } kg
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reason for Adjustment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Adjustment *
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[100px]"
                placeholder="Explain the reason for this inventory adjustment..."
                required
              />
              <p className="text-sm text-gray-600 mt-2">
                Required for audit trail. Be specific about the cause of the adjustment.
              </p>
            </div>

            {/* Authorization Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Authorization Number *
              </label>
              <input
                type="text"
                value={authorizationNumber}
                onChange={(e) => setAuthorizationNumber(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
                placeholder="AUTH-ADJ-001"
                required
              />
              <p className="text-sm text-gray-600 mt-2">
                Manager approval required for all inventory adjustments
              </p>
            </div>

            {/* Safety Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Safety Notice</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• All inventory adjustments require proper authorization</p>
                <p>• Physical verification must be completed before submission</p>
                <p>• This action will create a permanent audit record</p>
                <p>• Ensure all safety protocols are followed</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <ActionButton
                type="button"
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
                className="sm:w-auto"
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                variant={activeTab === 'increase' ? 'success' : 'destructive'}
                size="lg"
                disabled={!selectedMagazine || !selectedProduct || !adjustmentQuantity || !adjustmentReason || !authorizationNumber}
                className="flex-1 sm:flex-none sm:w-auto"
              >
                {activeTab === 'increase' ? 'Increase Inventory' : 'Decrease Inventory'}
              </ActionButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}