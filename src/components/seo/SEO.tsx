import { useEffect } from "react";

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

function setMetaTag(selector: string, attribute: string, value: string) {
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    const attrName = selector.startsWith("[property=") ? "property" : "name";
    element.setAttribute(attrName, attribute);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
}

export function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
}: SEOProps) {
  const pageTitle = title ? `${SITE_NAME} | ${title}` : SITE_NAME;

  useEffect(() => {
    document.title = pageTitle;

    setMetaTag('meta[name="description"]', "description", description);

    setMetaTag('meta[property="og:title"]', "og:title", pageTitle);
    setMetaTag('meta[property="og:description"]', "og:description", description);
    setMetaTag('meta[property="og:type"]', "og:type", type);
    setMetaTag('meta[property="og:site_name"]', "og:site_name", SITE_NAME);
    if (url) {
      setMetaTag('meta[property="og:url"]', "og:url", url);
    }
    setMetaTag('meta[property="og:image"]', "og:image", image);
    setMetaTag('meta[property="og:image:width"]', "og:image:width", "1200");
    setMetaTag('meta[property="og:image:height"]', "og:image:height", "630");
    setMetaTag('meta[property="og:image:alt"]', "og:image:alt", pageTitle);

    setMetaTag('meta[name="twitter:card"]', "twitter:card", "summary");
    setMetaTag('meta[name="twitter:title"]', "twitter:title", pageTitle);
    setMetaTag('meta[name="twitter:description"]', "twitter:description", description);
    setMetaTag('meta[name="twitter:image"]', "twitter:image", image);
  }, [pageTitle, description, image, url, type]);

  return null;
}

