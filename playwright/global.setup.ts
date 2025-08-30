import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'

// Configure Playwright with Clerk
setup('global setup', async ({}) => {
  await clerkSetup()
})

const authFile = path.join(__dirname, '.clerk/user.json')

setup('authenticate and save state to storage', async ({ page }) => {
  // Navigate to home page first (required by Clerk)
  await page.goto('/')
  
  // Sign in with test credentials
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  })
  
  // Navigate to protected dashboard to verify authentication
  await page.goto('/dashboard')
  
  // Wait for dashboard to load (verify authentication worked)
  await page.waitForSelector('h1, h2, [data-testid="dashboard"]', { timeout: 10000 })
  
  // Save authentication state for reuse in tests
  await page.context().storageState({ path: authFile })
})