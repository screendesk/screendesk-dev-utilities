/**
 * JsonLd Component
 *
 * A reusable component for adding structured data to pages
 *
 * @param {Object} props
 * @param {Object} props.data - The structured data object to be serialized
 * @returns {JSX.Element} - A script element with the structured data
 */
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

/**
 * Organization Schema
 *
 * @param {Object} props
 * @param {string} props.name - Organization name
 * @param {string} props.url - Organization website URL
 * @param {string} props.logo - Organization logo URL
 * @param {string[]} props.sameAs - Array of social media URLs
 * @returns {Object} - Organization schema object
 */
export function organizationSchema({
  name = 'Screendesk',
  url = 'https://screendesk.io',
  logo = 'https://screendesk.io/logo.png',
  sameAs = [],
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    sameAs,
  };
}

/**
 * Software Application Schema
 *
 * @param {Object} props
 * @param {string} props.name - Application name
 * @param {string} props.description - Application description
 * @param {string} props.applicationCategory - Application category
 * @param {string} props.operatingSystem - Operating system
 * @param {number} props.price - Price
 * @param {string} props.priceCurrency - Price currency
 * @param {number} props.ratingValue - Rating value
 * @param {number} props.ratingCount - Rating count
 * @returns {Object} - Software Application schema object
 */
export function softwareApplicationSchema({
  name = 'Screendesk',
  description = 'Screendesk is a cloud-based online service that provides instant screen recordings for faster ticket resolution and videoconference support.',
  applicationCategory = 'BusinessApplication',
  operatingSystem = 'Web',
  price,
  priceCurrency = 'USD',
  ratingValue,
  ratingCount,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    url: 'https://screendesk.io',
    applicationCategory,
    operatingSystem,
    ...(price != null && { offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      url: 'https://screendesk.io/pricing',
    } }),
    description,
    ...(ratingValue != null && ratingCount != null && { aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      ratingCount,
    } }),
  };
}

/**
 * Product Schema
 *
 * @param {Object} props
 * @param {string} props.name - Product name
 * @param {string} props.description - Product description
 * @param {string} props.image - Absolute URL of a representative product image
 * @param {number} props.price - Price
 * @param {string} props.priceCurrency - Price currency
 * @param {string} props.priceValidUntil - Price valid until date
 * @returns {Object} - Product schema object
 */
export function productSchema({
  name = 'Screendesk Pro',
  description = 'Advanced screen recording and videoconferencing solution for support teams',
  image,
  price,
  priceCurrency = 'USD',
  priceValidUntil,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    ...(image && { image }),
    ...(price != null && { offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      ...(priceValidUntil && { priceValidUntil }),
      availability: 'https://schema.org/InStock',
    } }),
  };
}

/**
 * FAQ Schema
 *
 * @param {Object} props
 * @param {Array} props.questions - Array of question objects with name and text properties
 * @returns {Object} - FAQ schema object
 */
export function faqSchema({
  questions = [
    {
      name: 'How does Screendesk work?',
      text: 'Screendesk allows support teams to request screen recordings from users directly through their browser, with no downloads required.',
    },
    {
      name: 'Does Screendesk integrate with help desk software?',
      text: 'Yes, Screendesk integrates with popular help desk software including Zendesk, HelpScout, and Intercom.',
    },
  ],
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((question) => ({
      '@type': 'Question',
      name: question.name,
      acceptedAnswer: {
        '@type': 'Answer',
        text: question.text,
      },
    })),
  };
}

/**
 * Breadcrumb Schema
 *
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items with name and item (URL) properties
 * @returns {Object} - Breadcrumb schema object
 */
export function breadcrumbSchema({
  items = [
    {
      position: 1,
      name: 'Home',
      item: 'https://screendesk.io',
    },
  ],
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.item,
    })),
  };
}

/**
 * Website Schema
 *
 * @param {Object} props
 * @param {string} props.name - Website name
 * @param {string} props.url - Website URL
 * @param {string} props.description - Website description
 * @param {string} props.searchUrl - Search URL template
 * @returns {Object} - Website schema object
 */
export function websiteSchema({
  name = 'Screendesk',
  url = 'https://screendesk.io',
  description = 'Screendesk provides instant screen recordings and videoconferencing for support teams to resolve tickets faster.',
  searchUrl,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    ...(searchUrl && { potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl
      },
      'query-input': 'required name=search_term_string'
    } })
  };
}

/**
 * Article Schema
 *
 * @param {Object} props
 * @param {string} props.headline - Article headline
 * @param {string} props.description - Article description
 * @param {string} props.image - Article image URL
 * @param {string} props.datePublished - Date published (ISO format)
 * @param {string} props.dateModified - Date modified (ISO format)
 * @param {string} props.authorName - Author name
 * @param {string} props.publisherName - Publisher name
 * @param {string} props.publisherLogo - Publisher logo URL
 * @returns {Object} - Article schema object
 */
export function articleSchema({
  headline = 'Video Support Platform for Customer Service Teams',
  description = 'Screendesk provides instant screen recordings and videoconferencing for support teams to resolve tickets faster without requiring downloads.',
  image = '/og-image.png', // Use relative path instead of absolute URL
  datePublished = new Date().toISOString(),
  dateModified = new Date().toISOString(),
  authorName = 'Screendesk Team',
  publisherName = 'Screendesk',
  publisherLogo = '/logo.png', // Use relative path instead of absolute URL
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://screendesk.io/',
    },
  };
}
