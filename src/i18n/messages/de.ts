import type { WebsiteMessages } from "./en";

export const deMessages = {
  homeGlobeRegionLabel:
    "Interaktiver Globus mit öffentlichen PawPal-Community-Beiträgen",
  homeGlobeLoadingPreviewLabel:
    "Visuelle Vorschau · Live-Beiträge werden geladen",
  homeGlobeStaticPreviewLabel:
    "Statische Vorschau · Dieser Browser kann den Live-Globus nicht anzeigen",
  homeGlobeEmptyLabel: "Noch keine beliebten öffentlichen Beiträge verfügbar",
  homeGlobeErrorLabel:
    "Live-Community-Markierungen sind vorübergehend nicht verfügbar",
  homeGlobePostLinkLabel: "Community-Beitrag öffnen aus",
  homeGlobeLikesLabel: "Gefällt-mir-Angaben",
  homeGlobeCommentsLabel: "Kommentare",
  homeGlobeSnippetFallback: "Community-Neuigkeit",
} satisfies Partial<WebsiteMessages>;
