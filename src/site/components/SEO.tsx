import { useEffect } from 'react';

export const SITE_ORIGIN = import.meta.env.VITE_SITE_URL || 'https://siliconomics-app.vercel.app';

interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: string;
  structuredData?: Record<string, unknown>;
}

export default function SEO({
  title,
  description,
  ogImage = '/og/home.svg',
  canonical,
  noindex = false,
  ogType = 'website',
  structuredData,
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setProperty = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:image', ogImage.startsWith('http') ? ogImage : `${SITE_ORIGIN}${ogImage}`);
    setProperty('og:type', ogType);
    setProperty('og:url', canonical || `${SITE_ORIGIN}${window.location.pathname}`);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage.startsWith('http') ? ogImage : `${SITE_ORIGIN}${ogImage}`);

    const canonicalUrl = canonical || `${SITE_ORIGIN}${window.location.pathname}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);

    const schemaId = 'siliconomics-route-schema';
    const existingSchema = document.getElementById(schemaId);
    if (structuredData) {
      const script = existingSchema || document.createElement('script');
      script.id = schemaId;
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(structuredData);
      if (!existingSchema) document.head.appendChild(script);
    } else {
      existingSchema?.remove();
    }
  }, [title, description, ogImage, canonical, noindex, ogType, structuredData]);

  return null;
}
