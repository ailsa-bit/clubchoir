import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}

const PageMeta = ({ title, description, path = "/", noindex = false }: PageMetaProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={`https://clubchoir.ca${path}`} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={`https://clubchoir.ca${path}`} />
    {noindex && <meta name="robots" content="noindex,nofollow" />}
  </Helmet>
);

export default PageMeta;
