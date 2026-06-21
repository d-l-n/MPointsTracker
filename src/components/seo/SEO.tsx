import { Helmet } from "react-helmet-async";

const SITE_NAME = "MPoints Tracker";
const SITE_URL = "https://mpoints-tracker.pages.dev";
const DEFAULT_DESC = "Registrá partidas de UNO, Truco, Chinchón y más. Seguí estadísticas, rankings y mirá quién lidera entre tus amigos.";
const DEFAULT_IMAGE = "https://mpoints-tracker.pages.dev/og-image.png";

interface SEOProps {
  title?: string | null;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

export function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
