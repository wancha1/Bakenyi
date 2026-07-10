import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  canonicalUrl?: string;
}

export default function SEO({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  canonicalUrl,
}: SEOProps) {
  const defaultTitle = 'Bakenye Cultural Heritage Hub | Preserving Lukenye Traditions';
  const siteUrl = window.location.origin;
  const currentPath = window.location.pathname;
  
  const finalTitle = title ? `${title} | Bakenye Heritage` : defaultTitle;
  const finalOgTitle = ogTitle || title || 'Bakenye Cultural Heritage';
  const finalOgDescription = ogDescription || description;
  const finalCanonical = canonicalUrl || `${siteUrl}${currentPath}`;
  
  // Use a default majestic header/banner photo representing traditional heritage as the default share card
  const defaultShareImage = 'https://images.unsplash.com/photo-1547891654-e66ed7edd96c?auto=format&fit=crop&q=80&w=1200&h=630';
  const finalOgImage = ogImage || defaultShareImage;

  const defaultKeywords = 'Bakenye, Lukenye language, Bantu heritage, oral histories, clan lineages, cultural archives, East African culture, traditional preservation';
  const finalKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={finalCanonical} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:site_name" content="Bakenye Digital Cultural Hub" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={finalOgImage} />
    </Helmet>
  );
}
