import type {Metadata} from 'next';
import './globals.css'; // Global styles
import {AuthProvider} from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Container Repair Tracker',
  description: 'Manage container repairs efficiently.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
