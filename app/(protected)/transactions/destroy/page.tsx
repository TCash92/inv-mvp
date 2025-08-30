'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/trpc';
import { ActionButton, ProductSelector, MagazineSelector, QuantityInput, StatusBadge } from '../../../../components/ui';
import { generateReferenceNumber } from '../../../../lib/utils';

const DestroyFormSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  magazineFromId: z.number().min(1, 'Source magazine is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  destructionMethod: z.string().min(1, 'Destruction method is required'),
  destructionReason: z.string().min(1, 'Reason for destruction is required'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  authorizationNumber: z.string().min(1, 'Authorization number is required'),
  disposalCertificateNumber: z.string().min(1, 'Disposal certificate number is required'),
  notes: z.string().optional(),
});

type DestroyFormData = z.infer<typeof DestroyFormSchema>;

const destructionMethods = [
  { value: 'controlled_detonation', label: 'Controlled Detonation' },
  { value: 'incineration', label: 'Incineration' },
  { value: 'chemical_neutralization', label: 'Chemical Neutralization' },
  { value: 'other', label: 'Other (specify in notes)' },
];

const destructionReasons = [
  { value: 'expired', label: 'Expired/Past Use Date' },
  { value: 'damaged', label: 'Physical Damage' },
  { value: 'contaminated', label: 'Contaminated' },
  { value: 'deteriorated', label: 'Deteriorated Condition' },
  { value: 'recalled', label: 'Manufacturer Recall' },
  { value: 'regulatory', label: 'Regulatory Requirement' },
  { value: 'other', label: 'Other (specify in notes)' },
];

export default function DestroyPage() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedMagazine, setSelectedMagazine] = useState<any>(null);

  // Fetch data
  const { data: products, isLoading: productsLoading } = api.products.getAll.useQuery();
  const { data: magazines, isLoading: magazinesLoading } = api.magazines.getAll.useQuery();

  // Create destruction mutation
  const createDestruction = api.transactions.createDestruction.useMutation({
    onSuccess: (data) => {
      alert(`Destruction transaction created successfully! Transaction ID: ${data.id}`);
      router.push('/dashboard');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DestroyFormData>({
    resolver: zodResolver(DestroyFormSchema),
    defaultValues: {
      quantity: 1,
      referenceNumber: generateReferenceNumber('Destruction'),
    },
  });

  // Watch form values
  const watchedValues = watch();

  // Generate new reference number
  const generateNewRefNumber = () => {
    setValue('referenceNumber', generateReferenceNumber('Destruction'));
  };

  const onSubmit = async (data: DestroyFormData) => {
    try {
      await createDestruction.mutateAsync({
        transactionDate: Date.now(),
        magazineFromId: data.magazineFromId,
        productId: data.productId,
        quantity: data.quantity,
        referenceNumber: data.referenceNumber,
        authorizationNumber: data.authorizationNumber,
        notes: `${data.destructionReason} - ${data.destructionMethod} - Certificate: ${data.disposalCertificateNumber}${data.notes ? ` - ${data.notes}` : ''}`,
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (productsLoading || magazinesLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Destroy Inventory</h1>
            <p className="text-gray-600 mt-1">Safe disposal of expired or damaged explosives</p>
          </div>
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-medium">
            Destruction
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <ProductSelector
              label="Product to Destroy"
              products={Array.isArray(products) ? products : []}
              value={selectedProduct}
              onChange={(product) => {
                setSelectedProduct(product);
                setValue('productId', product?.id || 0);
              }}
              error={errors.productId?.message}
              showCompatibility={true}
            />
          </div>

          {/* Magazine Selection */}
          <div>
            <MagazineSelector
              label="Source Magazine"
              magazines={Array.isArray(magazines) ? magazines : []}
              value={selectedMagazine}
              onChange={(magazine) => {
                setSelectedMagazine(magazine);
                setValue('magazineFromId', magazine?.id || 0);
              }}
              error={errors.magazineFromId?.message}
              showCapacity={true}
            />
          </div>

          {/* Stock Availability Display */}
          {selectedProduct && selectedMagazine && (
            <StockAvailability
              productId={selectedProduct.id}
              magazineId={selectedMagazine.id}
              productName={selectedProduct.name}
              magazineName={selectedMagazine.name}
              unit={selectedProduct.unit}
            />
          )}

          {/* Quantity Input */}
          <div>
            <QuantityInput
              label="Quantity to Destroy"
              value={watchedValues.quantity}
              onChange={(value) => setValue('quantity', value)}
              min={0.01}
              step={selectedProduct?.unit === 'each' ? 1 : 0.01}
              unit={selectedProduct?.unit}
              error={errors.quantity?.message}
              size="xl"
            />
          </div>

          {/* Destruction Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Destruction Method *
              </label>
              <select
                {...register('destructionMethod')}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
              >
                <option value="">Select method...</option>
                {destructionMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.destructionMethod && (
                <p className="text-sm text-red-600 font-medium mt-1">{errors.destructionMethod.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Destruction *
              </label>
              <select
                {...register('destructionReason')}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
              >
                <option value="">Select reason...</option>
                {destructionReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
              {errors.destructionReason && (
                <p className="text-sm text-red-600 font-medium mt-1">{errors.destructionReason.message}</p>
              )}
            </div>
          </div>

          {/* Reference Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reference Number
              </label>
              <div className="flex space-x-2">
                <input
                  {...register('referenceNumber')}
                  type="text"
                  placeholder="DEST-001"
                  className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
                />
                <ActionButton
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={generateNewRefNumber}
                  className="px-6"
                >
                  Generate
                </ActionButton>
              </div>
              {errors.referenceNumber && (
                <p className="text-sm text-red-600 font-medium mt-1">{errors.referenceNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Authorization Number *
              </label>
              <input
                {...register('authorizationNumber')}
                type="text"
                placeholder="AUTH-DEST-001"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
              />
              {errors.authorizationNumber && (
                <p className="text-sm text-red-600 font-medium mt-1">{errors.authorizationNumber.message}</p>
              )}
            </div>
          </div>

          {/* Disposal Certificate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Disposal Certificate Number *
            </label>
            <input
              {...register('disposalCertificateNumber')}
              type="text"
              placeholder="DISP-CERT-001"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
            />
            {errors.disposalCertificateNumber && (
              <p className="text-sm text-red-600 font-medium mt-1">{errors.disposalCertificateNumber.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Required for regulatory compliance</p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Additional details about the destruction process..."
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>

          {/* Safety Warning */}
          {selectedProduct && selectedMagazine && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Critical Safety Requirements</h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <p>• Ensure all safety protocols for {selectedProduct.compatibility_group} explosives are followed</p>
                    <p>• Verify destruction site authorization and environmental permits</p>
                    <p>• Confirm qualified personnel and emergency services are present</p>
                    <p>• Document all destruction procedures for regulatory compliance</p>
                    <p>• Net Explosive Weight: <strong>{(selectedProduct.net_explosive_weight_per_unit_kg * watchedValues.quantity).toFixed(2)} kg</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <ActionButton
              type="button"
              variant="outline"
              size="xl"
              onClick={() => router.back()}
              className="sm:w-auto"
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="danger"
              size="xl"
              loading={isSubmitting || createDestruction.isPending}
              disabled={!selectedProduct || !selectedMagazine}
              className="flex-1 sm:flex-none sm:w-auto"
            >
              Process Destruction
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );
}

// Component to show current stock availability
function StockAvailability({ 
  productId, 
  magazineId, 
  productName, 
  magazineName, 
  unit 
}: { 
  productId: number; 
  magazineId: number; 
  productName: string; 
  magazineName: string; 
  unit: string; 
}) {
  const { data: stockData, isLoading } = api.transactions.getCurrentStock.useQuery({ 
    productId, 
    magazineId 
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const currentStock = stockData?.current_quantity || 0;
  const stockColor = currentStock > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-2">Current Stock Availability</h3>
      <div className="text-sm text-gray-600">
        <p><strong>{productName}</strong> in <strong>{magazineName}</strong></p>
        <p className={`text-lg font-bold ${stockColor}`}>
          {currentStock} {unit} available
        </p>
        {currentStock === 0 && (
          <p className="text-red-600 text-xs mt-1">⚠ No stock available in this magazine</p>
        )}
      </div>
    </div>
  );
}