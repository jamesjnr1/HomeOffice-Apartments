import { Suspense } from 'react';
import { Fraunces, Inter } from 'next/font/google';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import VisitTracker from '@/components/VisitTracker';
import '@/styles/app.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Home-Office Apartments — Living Spring Gardens, Sunyani',
    template: '%s · Home-Office Apartments',
  },
  description:
    'Home-Office Apartments at Living Spring Gardens — thoughtfully designed apartments for remote workers and travellers in Sunyani, Ghana.',
};

export const viewport = {
  themeColor: '#2d6a4f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Suspense>{children}</Suspense>
        <AccessibilityWidget />
        <Suspense>
          <VisitTracker />
        </Suspense>
      </body>
    </html>
  );
}
