import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/auth/',
        '/login',
        '/register',
        '/email/',
        '/unsubscribe',
        '/resubscribe',
        '/store/admin/',
      ],
    },
    sitemap: ['/sitemap.xml', '/store/sitemap.xml'],
  };
}
