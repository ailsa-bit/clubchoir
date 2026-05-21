import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  ogImage?: string;
  /** One or more JSON-LD schema objects to embed on the page. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const PageMeta = ({
  title,
  description,
  path = "/",
  noindex = false,
  ogImage,
  jsonLd,
}: PageMetaProps) => {
  const url = `https://clubchoir.ca${path}`;
  const image = ogImage ?? "https://clubchoir.ca/og-image.jpg";
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default PageMeta;
