import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GrowEasy CSV Importer — AI-Powered CRM Lead Import',
  description: 'Intelligently import CSV leads into GrowEasy CRM using AI field mapping',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100`}
      >
        {children}
      </body>
    </html>
  );
}
