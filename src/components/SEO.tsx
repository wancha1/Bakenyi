import React from 'react';
import { useDocumentMetadata, MetadataProps } from '../hooks/useDocumentMetadata';

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
  // Delegate SEO rendering to the useDocumentMetadata hook for robust and clean state management
  const helmetElement = useDocumentMetadata({
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    canonicalUrl
  });

  return helmetElement;
}

