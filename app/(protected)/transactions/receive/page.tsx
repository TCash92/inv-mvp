'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/trpc';
import { ActionButton, ProductSelector, MagazineSelector, QuantityInput } from '../../../../components/ui';
import { generateReferenceNumber } from '../../../../lib/utils';

const ReceiveFormSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  magazineToId: z.number().min(1, 'Destination magazine is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  authorizationNumber: z.string().min(1, 'Authorization number is required'),
  notes: z.string().optional(),
});

type ReceiveFormData = z.infer<typeof ReceiveFormSchema>;

export default function ReceivePage() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedMagazine, setSelectedMagazine] = useState<any>(null);

  // Fetch data
  const { data: products, isLoading: productsLoading } = api.products.getAll.useQuery();
  const { data: magazines, isLoading: magazinesLoading } = api.magazines.getAll.useQuery();

  // Create receipt mutation
  const createReceipt = api.transactions.createReceipt.useMutation({
    onSuccess: (data) => {
      alert(`Receipt created successfully! Transaction ID: ${data.id}`);
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
  } = useForm<ReceiveFormData>({
    resolver: zodResolver(ReceiveFormSchema),
    defaultValues: {
      quantity: 1,
      referenceNumber: generateReferenceNumber('Receipt'),
    },
  });

  // Watch form values for validation
  const watchedValues = watch();

  // Generate new reference number
  const generateNewRefNumber = () => {
    setValue('referenceNumber', generateReferenceNumber('Receipt'));
  };

  const onSubmit = async (data: ReceiveFormData) => {
    try {
      await createReceipt.mutateAsync({
        transactionDate: Date.now(),
        magazineToId: data.magazineToId,
        productId: data.productId,
        quantity: data.quantity,
        referenceNumber: data.referenceNumber,
        authorizationNumber: data.authorizationNumber,
        notes: data.notes || undefined,
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
            <h1 className="text-2xl font-bold text-gray-900">Receive Inventory</h1>
            <p className="text-gray-600 mt-1">Add incoming explosives to magazine storage</p>
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
            Receipt
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <ProductSelector
              label="Product to Receive"
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
              label="Destination Magazine"
              magazines={Array.isArray(magazines) ? magazines : []}
              value={selectedMagazine}
              onChange={(magazine) => {
                setSelectedMagazine(magazine);
                setValue('magazineToId', magazine?.id || 0);
              }}
              error={errors.magazineToId?.message}
              showCapacity={true}
              filterBy="hasSpace"
            />
          </div>

          {/* Quantity Input */}
          <div>
            <QuantityInput
              label="Quantity"
              value={watchedValues.quantity}
              onChange={(value) => setValue('quantity', value)}
              min={0.01}
              step={selectedProduct?.unit === 'each' ? 1 : 0.01}
              unit={selectedProduct?.unit}
              error={errors.quantity?.message}
              size="xl"
            />
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
                  placeholder="PO-2024-001"
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
                placeholder="AUTH-001"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[56px]"
              />
              {errors.authorizationNumber && (
                <p className="text-sm text-red-600 font-medium mt-1">{errors.authorizationNumber.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Additional notes about this receipt..."
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>

          {/* Safety Information */}
          {selectedProduct && selectedMagazine && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Safety Check</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Product: <strong>{selectedProduct.name}</strong> (UN {selectedProduct.un_number})</p>
                <p>• Compatibility Group: <strong>{selectedProduct.compatibility_group}</strong></p>
                <p>• Destination: <strong>{selectedMagazine.code}</strong> - {selectedMagazine.name}</p>
                <p>• Net Weight: <strong>{(selectedProduct.net_explosive_weight_per_unit_kg * watchedValues.quantity).toFixed(2)} kg</strong></p>
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
              variant="success"
              size="xl"
              loading={isSubmitting || createReceipt.isPending}
              disabled={!selectedProduct || !selectedMagazine}
              className="flex-1 sm:flex-none sm:w-auto"
            >
              Receive Inventory
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );
}