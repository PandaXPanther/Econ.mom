import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  path?: string;            // canonical path, e.g. /frq-grader
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE = "https://econ.mom";

/**
 * SEO — sets per-page <title>, meta tags, OpenGraph, Twitter card, canonical
 * URL, and an optional JSON-LD blob. Mounts on render, restores nothing
 * on unmount (router will overwrite on next page).
 */
export function SEO({ title, description, path = "/", ogImage, jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title;

    const tags: Array<[string, string, string]> = [
      ["name", "description", description],
      ["property", "og:title", title],
      ["property", "og:description", description],
      ["property", "og:type", "website"],
      ["property", "og:site_name", "The Mother Of Econ"],
      ["property", "og:url", `${SITE}${path}`],
      ["property", "og:image", ogImage || `${SITE}/og.png`],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", title],
      ["name", "twitter:description", description],
      ["name", "twitter:image", ogImage || `${SITE}/og.png`],
    ];

    tags.forEach(([attr, key, val]) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", val);
    });

    // canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${SITE}${path}`);

    // JSON-LD
    const id = "page-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, ogImage, jsonLd]);

  return null;
}
