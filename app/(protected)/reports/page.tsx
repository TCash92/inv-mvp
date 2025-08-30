'use client';

import { useState } from 'react';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('stock-summary');
  const [dateRange, setDateRange] = useState('last-30-days');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Explosives Inventory Reports
        </h1>
        <p className="text-gray-600">
          Generate compliance and audit reports for explosives inventory management.
        </p>
      </div>

      {/* Report Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Report Type</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'stock-summary',
              title: 'Current Stock Summary',
              description: 'Overview of all current inventory by magazine and product',
              icon: '📊'
            },
            {
              id: 'transaction-history',
              title: 'Transaction History',
              description: 'Detailed transaction log for audit purposes',
              icon: '📋'
            },
            {
              id: 'reconciliation-report',
              title: 'Reconciliation Report',
              description: 'Monthly reconciliation results and variances',
              icon: '🔄'
            },
            {
              id: 'compliance-report',
              title: 'Compliance Report',
              description: 'Regulatory compliance status and documentation',
              icon: '✅'
            },
            {
              id: 'magazine-utilization',
              title: 'Magazine Utilization',
              description: 'Storage capacity usage and efficiency metrics',
              icon: '🏭'
            },
            {
              id: 'authorization-audit',
              title: 'Authorization Audit',
              description: 'Employee authorization tracking and expiration alerts',
              icon: '👥'
            }
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 border rounded-lg text-left transition-colors min-h-[120px] ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{report.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-sm text-gray-600">{report.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Range</h2>
        
        <div className="flex flex-wrap gap-4">
          {[
            { id: 'last-7-days', label: 'Last 7 Days' },
            { id: 'last-30-days', label: 'Last 30 Days' },
            { id: 'last-quarter', label: 'Last Quarter' },
            { id: 'last-year', label: 'Last Year' },
            { id: 'custom', label: 'Custom Range' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-4 py-2 rounded-lg border transition-colors min-h-[44px] ${
                dateRange === range.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Generate Report</h2>
            <p className="text-gray-600">
              Selected: {selectedReport.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} for {dateRange.replace('-', ' ')}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[48px] border border-gray-300">
              Preview
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[48px] font-semibold">
              Generate & Export
            </button>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Export Options</h3>
          <div className="flex flex-wrap gap-3">
            {['PDF', 'Excel (XLSX)', 'CSV'].map((format) => (
              <label key={format} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.toLowerCase()}
                  className="text-blue-600"
                  defaultChecked={format === 'PDF'}
                />
                <span className="text-gray-700">{format}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h2>
        <div className="text-gray-600 text-center py-8">
          No reports generated yet. Generate your first report above.
        </div>
      </div>
    </div>
  );
}