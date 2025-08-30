import { test, expect } from '@playwright/test'

test.describe('Authenticated User Tests', () => {
  
  test('should access dashboard after authentication', async ({ page }) => {
    // Navigate to dashboard - should be accessible due to stored auth state
    await page.goto('/dashboard')
    
    // Verify we're on the dashboard and not redirected to sign-in
    expect(page.url()).toContain('/dashboard')
    
    // Check for dashboard elements
    await expect(page.locator('h1, h2')).toContainText(['Explosives Inventory', 'Quick Actions', 'Current Stock', 'Stock'])
    
    // Verify quick action buttons are present
    await expect(page.getByRole('button', { name: /receive/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /issue/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /transfer/i })).toBeVisible()
  })

  test('should access transaction receive page', async ({ page }) => {
    await page.goto('/transactions/receive')
    
    // Should not be redirected to sign-in
    expect(page.url()).toContain('/transactions/receive')
    
    // Check for form elements
    await expect(page.getByText('Product')).toBeVisible()
    await expect(page.getByText('Magazine')).toBeVisible()
    await expect(page.getByText('Quantity')).toBeVisible()
  })

  test('should access transaction issue page', async ({ page }) => {
    await page.goto('/transactions/issue')
    
    // Should not be redirected to sign-in
    expect(page.url()).toContain('/transactions/issue')
    
    // Check for form elements specific to issue transactions
    await expect(page.getByText('Magazine')).toBeVisible()
    await expect(page.getByText('Product')).toBeVisible()
  })

  test('should access transaction transfer page', async ({ page }) => {
    await page.goto('/transactions/transfer')
    
    // Should not be redirected to sign-in
    expect(page.url()).toContain('/transactions/transfer')
    
    // Check for transfer-specific elements
    await expect(page.getByText('From Magazine')).toBeVisible()
    await expect(page.getByText('To Magazine')).toBeVisible()
  })

  test('should access stock page', async ({ page }) => {
    await page.goto('/stock')
    
    // Should not be redirected to sign-in
    expect(page.url()).toContain('/stock')
    
    // Check for stock overview elements
    await expect(page.locator('h1, h2')).toContainText('Stock')
  })

  test('should show current stock data on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Wait for data to load
    await page.waitForTimeout(2000)
    
    // Check that stock cards are present
    const stockCard = page.locator('[contains(., "Current Stock")]').first()
    await expect(stockCard).toBeVisible()
    
    // Check for transaction cards
    const transactionCard = page.locator('[contains(., "Recent Transactions")]').first()
    await expect(transactionCard).toBeVisible()
  })

  test('should have mobile-responsive dashboard', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // Verify mobile layout
    await expect(page.getByRole('button', { name: /receive/i })).toBeVisible()
    
    // Check that buttons maintain minimum touch target size
    const receiveButton = page.getByRole('button', { name: /receive/i })
    const buttonBox = await receiveButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44) // Minimum 44px for mobile
  })

  test('should handle form interactions on receive page', async ({ page }) => {
    await page.goto('/transactions/receive')
    
    // Wait for form to load
    await page.waitForSelector('form, [role="form"]', { timeout: 10000 })
    
    // Test quantity input
    const quantityInput = page.locator('input[type="number"], input[placeholder*="quantity" i]')
    if (await quantityInput.count() > 0) {
      await quantityInput.first().fill('10')
      expect(await quantityInput.first().inputValue()).toBe('10')
    }
    
    // Test reference number input
    const referenceInput = page.locator('input[placeholder*="reference" i], input[name*="reference" i]')
    if (await referenceInput.count() > 0) {
      await referenceInput.first().fill('TEST-REF-001')
      expect(await referenceInput.first().inputValue()).toBe('TEST-REF-001')
    }
  })
})