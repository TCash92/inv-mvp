'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/trpc';
import { ActionButton, ProductSelector, MagazineSelector, QuantityInput, StatusBadge } from '../../../../components/ui';
import { generateReferenceNumber } from '../../../../lib/utils';

const TransferFormSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  magazineFromId: z.number().min(1, 'Source magazine is required'),
  magazineToId: z.number().min(1, 'Destination magazine is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  authorizationNumber: z.string().min(1, 'Authorization number is required'),
  notes: z.string().optional(),
});

type TransferFormData = z.infer<typeof TransferFormSchema>;

export default function TransferPage() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSourceMagazine, setSelectedSourceMagazine] = useState<any>(null);
  const [selectedDestMagazine, setSelectedDestMagazine] = useState<any>(null);

  // Fetch data
  const { data: products, isLoading: productsLoading } = api.products.getAll.useQuery();
  const { data: magazines, isLoading: magazinesLoading } = api.magazines.getAll.useQuery();

  // Create transfer mutation
  const createTransfer = api.transactions.createTransfer.useMutation({
    onSuccess: (data) => {
      alert(`Transfer created successfully! TransferOut ID: ${data.transferOut.id}, TransferIn ID: ${data.transferIn.id}`);
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
  } = useForm<TransferFormData>({
    resolver: zodResolver(TransferFormSchema),
    defaultValues: {
      quantity: 1,
      referenceNumber: generateReferenceNumber('Transfer'),
    },
  });

  // Watch form values
  const watchedValues = watch();

  // Generate new reference number
  const generateNewRefNumber = () => {
    setValue('referenceNumber', generateReferenceNumber('Transfer'));
  };

  // Filter destination magazines to exclude source magazine
  const availableDestMagazines = magazines?.filter(
    (mag) => mag.id !== selectedSourceMagazine?.id
  ) || [];

  const onSubmit = async (data: TransferFormData) => {
    try {
      await createTransfer.mutateAsync({
        transactionDate: Date.now(),
        magazineFromId: data.magazineFromId,
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
            <h1 className="text-2xl font-bold text-gray-900">Transfer Inventory</h1>
            <p className="text-gray-600 mt-1">Move explosives between magazines</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium">
            Transfer
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <ProductSelector
              label="Product to Transfer"
              products={products || []}
              value={selectedProduct}
              onChange={(product) => {
                setSelectedProduct(product);
                setValue('productId', product?.id || 0);
              }}
              error={errors.productId?.message}
              showCompatibility={true}
            />
          </div>

          {/* Source Magazine */}
          <div>
            <MagazineSelector
              label="Source Magazine (From)"
              magazines={magazines || []}
              value={selectedSourceMagazine}
              onChange={(magazine) => {
                setSelectedSourceMagazine(magazine);
                setValue('magazineFromId', magazine?.id || 0);
                // Clear destination if it's the same as source
                if (selectedDestMagazine?.id === magazine?.id) {
                  setSelectedDestMagazine(null);
                  setValue('magazineToId', 0);
                }
              }}
              error={errors.magazineFromId?.message}
              showCapacity={true}
            />
          </div>

          {/* Transfer Arrow Visual */}
          {selectedSourceMagazine && (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-4">
                <div className="text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-gray-600 font-medium">Transferring</span>
              </div>
            </div>
          )}

          {/* Destination Magazine */}
          <div>
            <MagazineSelector
              label="Destination Magazine (To)"
              magazines={availableDestMagazines}
              value={selectedDestMagazine}
              onChange={(magazine) => {
                setSelectedDestMagazine(magazine);
                setValue('magazineToId', magazine?.id || 0);
              }}
              error={errors.magazineToId?.message}
              showCapacity={true}
              filterBy="hasSpace"
            />
          </div>

          {/* Stock & Compatibility Check */}
          {selectedProduct && selectedSourceMagazine && selectedDestMagazine && (
            <TransferValidation
              productId={selectedProduct.id}
              sourceMagazineId={selectedSourceMagazine.id}
              destMagazineId={selectedDestMagazine.id}
              product={selectedProduct}
              sourceMagazine={selectedSourceMagazine}
              destMagazine={selectedDestMagazine}
              quantity={watchedValues.quantity}
            />
          )}

          {/* Quantity Input */}
          <div>
            <QuantityInput
              label="Quantity to Transfer"
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
                Transfer Reference
              </label>
              <div className="flex space-x-2">
                <input
                  {...register('referenceNumber')}
                  type="text"
                  placeholder="TRF-001"
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

          {/* Purpose/Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Transfer Reason
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Reason for transfer (e.g., magazine maintenance, capacity balancing, etc.)"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>
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
              variant="warning"
              size="xl"
              loading={isSubmitting || createTransfer.isPending}
              disabled={!selectedProduct || !selectedSourceMagazine || !selectedDestMagazine}
              className="flex-1 sm:flex-none sm:w-auto"
            >
              Execute Transfer
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );
}

// Component for transfer validation checks
function TransferValidation({
  productId,
  sourceMagazineId,
  destMagazineId,
  product,
  sourceMagazine,
  destMagazine,
  quantity
}: {
  productId: number;
  sourceMagazineId: number;
  destMagazineId: number;
  product: any;
  sourceMagazine: any;
  destMagazine: any;
  quantity: number;
}) {
  const { data: sourceStock, isLoading: sourceLoading } = api.transactions.getCurrentStock.useQuery({
    productId,
    magazineId: sourceMagazineId
  });

  const { data: compatibility, isLoading: compatLoading } = api.products.validateCompatibility.useQuery({
    productId,
    magazineId: destMagazineId
  });

  if (sourceLoading || compatLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const sourceQuantity = sourceStock?.current_quantity || 0;
  const hasEnoughStock = sourceQuantity >= quantity;
  const isCompatible = compatibility?.compatible;
  const netWeight = (product.net_explosive_weight_per_unit_kg * quantity).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Stock Availability */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Stock Availability</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Available in {sourceMagazine.code}:</span>
            <p className={`font-semibold ${hasEnoughStock ? 'text-green-600' : 'text-red-600'}`}>
              {sourceQuantity} {product.unit}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Transfer amount:</span>
            <p className={`font-semibold ${hasEnoughStock ? 'text-blue-600' : 'text-red-600'}`}>
              {quantity} {product.unit} ({netWeight} kg)
            </p>
          </div>
        </div>
        {!hasEnoughStock && (
          <div className="mt-2 text-red-600 text-xs">
            ⚠ Insufficient stock for transfer
          </div>
        )}
      </div>

      {/* Compatibility Check */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Compatibility Check</h3>
        <div className="flex items-center space-x-2">
          <StatusBadge variant="compatibility" type={product.compatibility_group}>
            Group {product.compatibility_group}
          </StatusBadge>
          <span className="text-gray-600">→</span>
          <span className="text-gray-700">{destMagazine.code}</span>
          {isCompatible ? (
            <StatusBadge variant="success">Compatible</StatusBadge>
          ) : (
            <StatusBadge variant="danger">Not Compatible</StatusBadge>
          )}
        </div>
        {!isCompatible && compatibility?.conflicts && (
          <div className="mt-2 text-red-600 text-xs">
            ⚠ Cannot store with: {compatibility.conflicts.join(', ')}
          </div>
        )}
      </div>

      {/* Transfer Summary */}
      <div className={`rounded-lg p-4 border-2 ${
        hasEnoughStock && isCompatible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <h3 className="font-semibold text-gray-900 mb-2">Transfer Summary</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• <strong>{product.name}</strong> (UN {product.un_number})</p>
          <p>• From: <strong>{sourceMagazine.code}</strong> - {sourceMagazine.name}</p>
          <p>• To: <strong>{destMagazine.code}</strong> - {destMagazine.name}</p>
          <p>• Quantity: <strong>{quantity} {product.unit}</strong> ({netWeight} kg NET)</p>
        </div>
        {(!hasEnoughStock || !isCompatible) && (
          <div className="mt-2 text-red-700 text-sm font-medium">
            ⚠ Transfer cannot proceed - resolve issues above
          </div>
        )}
      </div>
    </div>
  );
}