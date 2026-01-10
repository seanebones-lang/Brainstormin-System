import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'eleven AI Brainstorm | NextEleven',
  description: 'AI-powered idea generation with xAI Grok-β. Generate innovative, actionable ideas in real-time.',
  keywords: ['AI', 'brainstorming', 'idea generation', 'xAI', 'Grok', 'Next.js'],
  authors: [{ name: 'NextEleven' }],
  creator: 'NextEleven',
  publisher: 'NextEleven',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'eleven AI Brainstorm | NextEleven',
    description: 'AI-powered idea generation with xAI Grok-β',
    siteName: 'eleven AI Brainstorm',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eleven AI Brainstorm | NextEleven',
    description: 'AI-powered idea generation with xAI Grok-β',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes if needed
  },
};

/**
 * Root layout component
 * Implements WCAG 2.2 Level AA accessibility standards
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://api.x.ai" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <div id="skip-link" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white">
          <a href="#main-content">Skip to main content</a>
        </div>
        <main id="main-content">{children}</main>
        <footer className="mt-auto p-4 text-center text-sm text-gray-500" role="contentinfo">
          <p>
            AI by <a href="https://next11.com" className="text-blue-600 hover:text-blue-800 underline" aria-label="Visit NextEleven website">NextEleven</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
