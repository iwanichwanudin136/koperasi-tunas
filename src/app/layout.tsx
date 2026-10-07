import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'Koperasi Taawun Amal Sejahtera — Sistem Informasi Koperasi Syariah',
  description:
    'Aplikasi digital pencatatan transaksi, simpanan, pembiayaan syariah, invoice kasir, stok, SHU, dan promosi digital Koperasi Taawun Amal Sejahtera.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

import { Providers } from '@/components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#f4f6fa] text-[#3a3a3a] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
