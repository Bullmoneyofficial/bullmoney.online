import { Html, Head, Main, NextScript } from 'next/document';
import { memo } from 'react';

const OptimizedDocument = memo(() => {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Optimize resource hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />

        {/* Disable automatic detection of phone numbers */}
        <meta name="format-detection" content="telephone=no" />

        {/* Optimize for performance */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
});

OptimizedDocument.displayName = 'OptimizedDocument';

export default OptimizedDocument;
