import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Tourist Cocoon – Hotel Automation',
  description: 'Automate hotel reception: reservations, check-in and room access.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={outfit.variable}>
      <body className="font-sans bg-transparent min-h-screen">
        {children}
        <Navbar />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '999px',
              background: '#1B2F6E',
              color: '#fff',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
            },
          }}
        />
      </body>
    </html>
  );
}
