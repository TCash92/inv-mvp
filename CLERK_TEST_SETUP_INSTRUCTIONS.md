# Clerk Test User Setup Instructions

## Overview
This document provides step-by-step instructions for setting up Playwright testing with Clerk authentication for the explosives inventory system.

## Prerequisites
- ✅ @clerk/testing package installed
- ✅ Playwright configuration created
- ✅ Test credentials added to .env.local
- ✅ Global setup file created

## Manual Setup Required in Clerk Dashboard

### Step 1: Access Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your project: **inv-mvp** (or the project name you used)
3. Ensure you're using the **Development** environment (not Production)

### Step 2: Enable Username/Password Authentication
1. Navigate to **User & Authentication** → **Email, Phone, Username**
2. **Enable Username authentication:**
   - Toggle ON "Username"
   - Set as "Optional" or "Required"
3. **Enable Password authentication:**
   - Toggle ON "Password"
   - Set password requirements as needed
   - Ensure minimum length allows "TestPassword123!"

### Step 3: Create Test User
1. Go to **Users** section in the dashboard
2. Click **Create User** button
3. Fill in the test user details:
   ```
   Username: test@explosives.local
   Email: test@explosives.local
   Password: TestPassword123!
   First Name: Test
   Last Name: Operator
   ```
4. Click **Create** to save the user

### Step 4: Verify User Permissions
1. Find the created user in the Users list
2. Click on the user to view details
3. Ensure the user is **Active** (not banned/suspended)
4. Note the **User ID** for reference (optional)

## Environment Variables Verification
Ensure your `.env.local` file contains:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
E2E_CLERK_USER_USERNAME=test@explosives.local
E2E_CLERK_USER_PASSWORD=TestPassword123!
```

## Test the Setup

### Option 1: Manual Login Test
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/sign-in`
3. Try logging in with:
   - Username: `test@explosives.local`
   - Password: `TestPassword123!`
4. Verify you're redirected to `/dashboard`

### Option 2: Run Playwright Tests
1. Install Playwright browsers: `npx playwright install`
2. Run the global setup: `npx playwright test global.setup.ts`
3. Run authenticated tests: `npx playwright test authenticated.spec.ts`

## Troubleshooting

### Common Issues:

#### "User not found" Error
- Verify the test user was created in Clerk dashboard
- Check the username/email matches exactly
- Ensure you're in the Development environment

#### "Invalid password" Error  
- Verify password requirements in Clerk dashboard
- Check the password matches exactly (case-sensitive)
- Ensure password meets minimum requirements

#### "Authentication method not enabled"
- Verify Username authentication is enabled in Clerk dashboard
- Verify Password authentication is enabled
- Check that both are set to "Optional" or "Required"

#### "Bot traffic detected" Error
- Ensure `clerkSetup()` is called in global setup
- Verify Clerk testing package is properly installed
- Check that environment variables are set correctly

### Debug Steps:

1. **Check Clerk Configuration:**
   ```bash
   # Verify environment variables
   cat .env.local | grep CLERK
   ```

2. **Verify Test User Creation:**
   - Log into Clerk dashboard
   - Check Users section for test@explosives.local
   - Verify user is Active

3. **Test Manual Login:**
   - Try logging in through the web interface
   - Check browser console for errors
   - Verify network requests in developer tools

4. **Check Playwright Setup:**
   ```bash
   # Run just the global setup
   npx playwright test global.setup.ts --headed
   
   # Check if auth state was saved
   ls -la playwright/.clerk/
   ```

## File Structure After Setup
```
inv-mvp/
├── playwright/
│   ├── .clerk/
│   │   └── user.json (created after successful auth)
│   ├── global.setup.ts
│   └── authenticated.spec.ts
├── playwright.config.ts
├── .env.local (updated with test credentials)
└── CLERK_TEST_SETUP_INSTRUCTIONS.md (this file)
```

## Next Steps
Once the test user is created and verified:

1. ✅ Run `npx playwright install` to install browsers
2. ✅ Run `npx playwright test` to execute all tests
3. ✅ Verify authenticated tests pass
4. ✅ Start testing protected routes with Playwright MCP tools

## Security Notes
- Test user credentials are only for development environment
- Never use these credentials in production
- Test user has no access to production data
- Authentication state is stored locally and git-ignored

## Support
If you encounter issues:
1. Check Clerk documentation: https://clerk.com/docs/testing/playwright
2. Verify environment variables and user creation
3. Test manual login first before automated tests
4. Check Clerk dashboard for user status and authentication settings