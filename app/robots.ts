import type { MetadataRoute } from 'next';
import { SEO_DOMAINS, PRIMARY_DOMAIN } from '@/lib/seo-domains';

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
    sitemap: SEO_DOMAINS.flatMap((domain) => [
      `${domain}/sitemap.xml`,
      `${domain}/store/sitemap.xml`,
    ]),
    host: PRIMARY_DOMAIN,
  };
}
