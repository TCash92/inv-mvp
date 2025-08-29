Setting up SQLite on Ubuntu 24.04 LTS:

## 1) Install SQLite

SQLite is usually pre-installed on Ubuntu, but let's make sure you have the latest version:

```bash
# Update package list
sudo apt update

# Install SQLite3 (if not already installed)
sudo apt install sqlite3

# Install SQLite development libraries (useful for programming)
sudo apt install libsqlite3-dev
```

## 2) Verify Installation

```bash
# Check SQLite version
sqlite3 --version

# This should show something like: 3.45.1 2024-01-30 16:01:20
```

## 3) Basic SQLite Usage

### Create and Access a Database

```bash
# Create/open a database file
sqlite3 mydatabase.db

# Or create in a specific directory
sqlite3 /var/lib/sqlite/mydatabase.db
```

### Basic SQLite Commands

```sql
-- Inside SQLite shell
.help                    -- Show all commands
.databases              -- List databases
.tables                 -- List tables
.schema table_name      -- Show table structure
.quit                   -- Exit SQLite
```

## 4) Set Up Proper Directory Structure

```bash
# Create a dedicated directory for SQLite databases
sudo mkdir -p /var/lib/sqlite
sudo chown $USER:$USER /var/lib/sqlite
chmod 755 /var/lib/sqlite

# Or use a user directory
mkdir -p ~/databases
```

## 5) Configure for Web Applications (if needed)

If you're using SQLite with web applications:

```bash
# Set proper permissions for web server access
sudo chown www-data:www-data /var/lib/sqlite
sudo chmod 755 /var/lib/sqlite

# For database files
sudo chown www-data:www-data /var/lib/sqlite/*.db
sudo chmod 644 /var/lib/sqlite/*.db
```

## 6) Install SQLite Browser (Optional)

For a GUI interface:

```bash
# Install DB Browser for SQLite
sudo apt install sqlitebrowser

# Or install via snap
sudo snap install sqlitebrowser
```

## 7) Performance and Security Configuration

### Create a basic SQLite configuration script:

```bash
# Create a configuration file
nano ~/sqlite_config.sql
-- Basic performance settings
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000000;
PRAGMA temp_store = memory;
```

### Apply configuration:

```bash
sqlite3 mydatabase.db < ~/sqlite_config.sql
```

## 8) Backup Strategy

### Create a backup script:

```bash
nano ~/backup_sqlite.sh
#!/bin/bash
BACKUP_DIR="/home/$USER/sqlite_backups"
DB_DIR="/var/lib/sqlite"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

for db in $DB_DIR/*.db; do
    if [ -f "$db" ]; then
        filename=$(basename "$db" .db)
        sqlite3 "$db" ".backup $BACKUP_DIR/${filename}_${DATE}.db"
        echo "Backed up $db to $BACKUP_DIR/${filename}_${DATE}.db"
    fi
done
chmod +x ~/backup_sqlite.sh
```

### Set up automated backups with cron:

```bash
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /home/$USER/backup_sqlite.sh
```

## 9) Common Use Cases

### Create a sample database:

```bash
sqlite3 example.db
-- Create a table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email) VALUES 
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com');

-- Query data
SELECT * FROM users;

-- Exit
.quit
```

## 10) Programming Language Integration

### Python (sqlite3 module is built-in):

```bash
python3 -c "import sqlite3; print('SQLite3 module available')"
```

### Node.js:

```bash
# Install sqlite3 for Node.js
npm install sqlite3
# Or for newer async/await support
npm install sqlite
```

### PHP:

```bash
# Check if SQLite PDO extension is available
php -m | grep sqlite
# If not available:
sudo apt install php-sqlite3
```

## 11) Monitoring and Maintenance

### Check database integrity:

```bash
sqlite3 mydatabase.db "PRAGMA integrity_check;"
```

### Optimize database:

```bash
sqlite3 mydatabase.db "VACUUM;"
```

### View database size:

```bash
ls -lh *.db
```

## 12) Security Considerations

```bash
# Set restrictive permissions on sensitive databases
chmod 600 sensitive_database.db

# For multi-user access, use groups
sudo groupadd sqlite_users
sudo usermod -a -G sqlite_users $USER
sudo chgrp sqlite_users /var/lib/sqlite/*.db
sudo chmod 660 /var/lib/sqlite/*.db
```



---



Clerk authentication with SQLite for user management:

## 1) Clerk + SQLite Integration Overview

Clerk handles authentication while SQLite stores your application's user data. The typical flow:

- Clerk manages auth (login/signup/sessions)
- Your app syncs user data to SQLite
- SQLite stores additional user profile data, app-specific data, etc.

## 2) Database Schema Setup

First, create your SQLite user schema:

```sql
-- Create users table that syncs with Clerk
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clerk_user_id TEXT UNIQUE NOT NULL,  -- Clerk's user ID
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    profile_image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_sign_in DATETIME,
    is_active BOOLEAN DEFAULT true
);

-- Additional app-specific user data
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bio TEXT,
    company TEXT,
    role TEXT,
    preferences JSON, -- SQLite supports JSON since 3.45+
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

## 3) Frontend Integration (Next.js Example)

### Install Clerk

```bash
npm install @clerk/nextjs
```

### Environment Variables (.env.local)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Clerk Provider Setup (app/layout.tsx)

```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## 4) Backend Database Integration

### Database Connection (lib/db.js)

```javascript
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

export default db;
```

### User Sync Utility (lib/userSync.js)

```javascript
import db from './db.js';
import { clerkClient } from '@clerk/nextjs/server';

// Sync user from Clerk to SQLite
export async function syncUserToDatabase(clerkUserId) {
  try {
    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    // Check if user exists in our database
    const existingUser = db.prepare(
      'SELECT * FROM users WHERE clerk_user_id = ?'
    ).get(clerkUserId);

    const userData = {
      clerk_user_id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      username: clerkUser.username || '',
      profile_image_url: clerkUser.profileImageUrl || '',
      last_sign_in: new Date().toISOString()
    };

    if (existingUser) {
      // Update existing user
      const updateStmt = db.prepare(`
        UPDATE users 
        SET email = ?, first_name = ?, last_name = ?, username = ?, 
            profile_image_url = ?, last_sign_in = ?, updated_at = CURRENT_TIMESTAMP
        WHERE clerk_user_id = ?
      `);
      
      updateStmt.run(
        userData.email,
        userData.first_name,
        userData.last_name,
        userData.username,
        userData.profile_image_url,
        userData.last_sign_in,
        userData.clerk_user_id
      );
      
      return existingUser.id;
    } else {
      // Create new user
      const insertStmt = db.prepare(`
        INSERT INTO users (clerk_user_id, email, first_name, last_name, username, profile_image_url, last_sign_in)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertStmt.run(
        userData.clerk_user_id,
        userData.email,
        userData.first_name,
        userData.last_name,
        userData.username,
        userData.profile_image_url,
        userData.last_sign_in
      );
      
      return result.lastInsertRowid;
    }
  } catch (error) {
    console.error('Error syncing user to database:', error);
    throw error;
  }
}

// Get user from database by Clerk ID
export function getUserByClerkId(clerkUserId) {
  const stmt = db.prepare('SELECT * FROM users WHERE clerk_user_id = ?');
  return stmt.get(clerkUserId);
}

// Update user profile
export function updateUserProfile(userId, profileData) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_profiles (user_id, bio, company, role, preferences)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    userId,
    profileData.bio || null,
    profileData.company || null,
    profileData.role || null,
    JSON.stringify(profileData.preferences || {})
  );
}
```

## 5) API Routes for User Management

### Webhook Handler (app/api/webhooks/clerk/route.js)

```javascript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { syncUserToDatabase } from '@/lib/userSync'

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    try {
      await syncUserToDatabase(evt.data.id)
      console.log(`User ${evt.data.id} synced to database`)
    } catch (error) {
      console.error('Error syncing user:', error)
      return new Response('Error syncing user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}
```

### User Profile API (app/api/user/profile/route.js)

```javascript
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, updateUserProfile } from '@/lib/userSync'

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = getUserByClerkId(userId)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({ user })
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  const { userId } = auth()
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profileData = await request.json()
    const user = getUserByClerkId(userId)
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    updateUserProfile(user.id, profileData)
    
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## 6) Frontend Components

### Protected Page Example (app/dashboard/page.tsx)

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export default async function DashboardPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Your app content here */}
      </div>
    </div>
  )
}
```

### User Profile Component (components/UserProfile.tsx)

```tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

export default function UserProfile() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile()
    }
  }, [isLoaded, user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      setProfile(data.user)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">User Profile</h2>
      
      {profile && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <p className="text-gray-900">{profile.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Name</label>
            <p className="text-gray-900">
              {profile.first_name} {profile.last_name}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Last Sign In</label>
            <p className="text-gray-900">
              {new Date(profile.last_sign_in).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
```

## 7) Clerk Webhook Configuration

1. Go to your Clerk Dashboard
2. Navigate to Webhooks
3. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
4. Select events: `user.created`, `user.updated`, `user.deleted`
5. Copy the webhook secret to your `.env.local`

## 8) Production Considerations

### Database Backup for User Data

```bash
# Add to your backup script
sqlite3 app.db ".backup backup_$(date +%Y%m%d_%H%M%S).db"
```

### Environment Variables for Production

```bash
# Add to your production environment
DATABASE_PATH=/var/lib/sqlite/production.db
CLERK_WEBHOOK_SECRET=whsec_...
```

### Security Headers (middleware.js)

```javascript
import { authMiddleware } from '@clerk/nextjs/server'

export default authMiddleware({
  publicRoutes: ['/'],
  ignoredRoutes: ['/api/webhooks/clerk']
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```



---



Internal team webapp accessed via IP:port on mobile phones optimal tech stack:

## Recommended Tech Stack

### **Frontend Framework**

**Next.js 14+ (App Router)** with React

- **Why**: Server-side rendering improves performance on slower mobile connections
- Built-in optimization for mobile devices
- Excellent developer experience and rapid development
- Strong TypeScript support

### **Styling**

**Tailwind CSS**

- **Why**: Utility-first approach perfect for responsive mobile design
- Small bundle size (important for mobile internet)
- Matches the industrial UI/UX principles from your design doc
- Easy to implement the high-contrast, large touch targets you need

### **Authentication**

**Clerk**

- **Why**: As discussed, handles auth complexity
- Works great with IP-based access
- Mobile-optimized auth flows
- Webhook integration for user sync

### **Database**

**SQLite**

- **Why**: SQLite for local development and simple deployments
- No external database dependencies to manage

### **Backend/API**

**Next.js API Routes + tRPC**

- **Why**: Type-safe API calls between frontend/backend
- Reduces bundle size vs REST
- Better error handling for unreliable mobile connections

### **State Management**

**Zustand** (lightweight) or **React Query/TanStack Query**

- **Why**: React Query for server state management
- Excellent caching for mobile connections
- Offline-first capabilities

### **Mobile Optimization**

**PWA (Progressive Web App)**

- **Why**: App-like experience without app store deployment
- Works offline when connection drops
- Can be "installed" on home screen
- Push notifications support

## Complete Implementation Example

### 1) Project Setup

```bash
npx create-next-app@latest industrial-app --typescript --tailwind --eslint --app
cd industrial-app

# Install additional dependencies
npm install @clerk/nextjs @trpc/client @trpc/server @trpc/react-query @trpc/next @tanstack/react-query
npm install better-sqlite3 @types/better-sqlite3
npm install zustand
npm install @hookform/resolvers zod react-hook-form
```

### 2) Project Structure

```
industrial-app/
├── app/
│   ├── api/
│   │   ├── trpc/[trpc]/
│   │   └── webhooks/clerk/
│   ├── dashboard/
│   ├── equipment/
│   ├── maintenance/
│   └── layout.tsx
├── components/
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   └── mobile/       # Mobile-specific components
├── lib/
│   ├── db.ts         # SQLite connection
│   ├── trpc.ts       # tRPC setup
│   └── utils.ts
├── server/
│   ├── api/
│   │   ├── routers/
│   │   └── root.ts
│   └── db/
└── public/
    └── manifest.json  # PWA manifest
```

### 3) Mobile-First Configuration

#### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for mobile
  compress: true,
  poweredByHeader: false,
  
  // PWA configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },

  // Optimize images for mobile
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
}

module.exports = nextConfig
```

### 4) PWA Setup

#### public/manifest.json

```json
{
  "name": "Industrial Maintenance App",
  "short_name": "MaintenanceApp",
  "description": "Internal team maintenance tracking",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1f2937",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 5) Mobile-Optimized Layout

#### app/layout.tsx

```tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc-provider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata = {
  title: 'Industrial Maintenance',
  description: 'Internal team maintenance tracking',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom on form focus
  },
  manifest: '/manifest.json',
  themeColor: '#1f2937',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="bg-gray-900 text-white min-h-screen">
          <TRPCProvider>
            <div className="safe-area-inset">
              {children}
            </div>
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### 6) Tailwind Configuration for Industrial UI

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Industrial color palette
      colors: {
        industrial: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a',
        },
        status: {
          normal: '#10b981',    // Green
          warning: '#f59e0b',   // Amber
          critical: '#ef4444',  // Red
          info: '#3b82f6',      // Blue
        }
      },
      // Large touch targets
      spacing: {
        'touch': '44px',  // Minimum touch target
        'touch-lg': '56px', // Large touch target
      },
      // Mobile-first font sizes
      fontSize: {
        'mobile-xs': ['14px', '20px'],
        'mobile-sm': ['16px', '24px'],
        'mobile-base': ['18px', '28px'],
        'mobile-lg': ['20px', '32px'],
        'mobile-xl': ['24px', '36px'],
      }
    },
  },
  plugins: [],
}
```

### 7) Mobile-Optimized Components

#### components/ui/Button.tsx

```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles - optimized for gloves/fat fingers
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Size variants - all meeting minimum touch targets
          {
            'h-touch px-4 text-mobile-sm': size === 'sm',
            'h-touch-lg px-6 text-mobile-base': size === 'md',
            'h-16 px-8 text-mobile-lg': size === 'lg',
          },
          // Color variants - high contrast for outdoor visibility
          {
            'bg-status-info text-white hover:bg-blue-600 focus-visible:ring-blue-500': 
              variant === 'primary',
            'bg-gray-700 text-white hover:bg-gray-600 focus-visible:ring-gray-500': 
              variant === 'secondary',
            'bg-status-critical text-white hover:bg-red-600 focus-visible:ring-red-500': 
              variant === 'danger',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
export { Button }
```

### 8) tRPC Setup for Type-Safe APIs

#### server/api/root.ts

```typescript
import { equipmentRouter } from './routers/equipment'
import { maintenanceRouter } from './routers/maintenance'
import { userRouter } from './routers/user'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  equipment: equipmentRouter,
  maintenance: maintenanceRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
```

### 9) Offline-First Data Layer

#### lib/offline-store.ts

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OfflineState {
  pendingActions: Array<{
    id: string
    type: string
    data: any
    timestamp: number
  }>
  addPendingAction: (action: any) => void
  removePendingAction: (id: string) => void
  isOnline: boolean
  setOnlineStatus: (status: boolean) => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      isOnline: navigator.onLine,
      
      addPendingAction: (action) => {
        set(state => ({
          pendingActions: [...state.pendingActions, {
            ...action,
            id: crypto.randomUUID(),
            timestamp: Date.now()
          }]
        }))
      },
      
      removePendingAction: (id) => {
        set(state => ({
          pendingActions: state.pendingActions.filter(a => a.id !== id)
        }))
      },
      
      setOnlineStatus: (status) => {
        set({ isOnline: status })
        
        // Sync pending actions when coming back online
        if (status && get().pendingActions.length > 0) {
          // Implement sync logic here
        }
      }
    }),
    {
      name: 'offline-storage'
    }
  )
)
```

## Deployment Strategy

### 1) VPS Deployment

```bash
# Install Node.js 18+ on Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone and build your app
git clone <your-repo>
cd industrial-app
npm install
npm run build

# Start with PM2
pm2 start npm --name "industrial-app" -- start
pm2 startup
pm2 save
```

### 2) Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-vps-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Optimize for mobile
        gzip on;
        gzip_types text/css application/javascript application/json;
    }
}
```



---

