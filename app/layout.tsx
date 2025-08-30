import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { TRPCProvider } from '../lib/trpc-provider';
import { isTestingMode } from '../lib/test-auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Explosives Inventory System',
  description: 'Mobile-first explosives inventory management for field operations',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  themeColor: '#1f2937',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Explosives Inventory',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In testing mode, skip ClerkProvider entirely
  if (isTestingMode()) {
    return (
      <html lang="en">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="format-detection" content="telephone=no" />
        </head>
        <body className="antialiased bg-background text-foreground min-h-screen">
          <TRPCProvider>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
          </TRPCProvider>
        </body>
      </html>
    );
  }

  // Normal production layout with ClerkProvider
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: '#1f2937',
          colorBackground: '#ffffff',
          colorInputBackground: '#f9fafb',
          colorInputText: '#111827',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 500,
        },
        elements: {
          formButtonPrimary: 'min-h-touch touch-target-large font-semibold',
          formFieldInput: 'min-h-touch text-mobile-base',
          card: 'shadow-lg',
          headerTitle: 'text-mobile-lg font-bold',
          headerSubtitle: 'text-mobile-base',
        },
      }}
    >
      <html lang="en">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="format-detection" content="telephone=no" />
        </head>
        <body className="antialiased bg-background text-foreground min-h-screen">
          <TRPCProvider>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}