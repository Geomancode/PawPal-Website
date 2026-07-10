import type { WebsiteMessages } from "./en";

export const frMessages = {
  homeGlobeRegionLabel:
    "Globe interactif des publications publiques de la communauté PawPal",
  homeGlobeLoadingPreviewLabel:
    "Aperçu visuel · Chargement des publications en direct",
  homeGlobeStaticPreviewLabel:
    "Aperçu statique · Ce navigateur ne peut pas afficher le globe en direct",
  homeGlobeEmptyLabel:
    "Aucune publication publique populaire à afficher pour le moment",
  homeGlobeErrorLabel:
    "Les repères de la communauté en direct sont temporairement indisponibles",
  homeGlobePostLinkLabel: "Ouvrir la publication de la communauté depuis",
  homeGlobeLikesLabel: "mentions J’aime",
  homeGlobeCommentsLabel: "commentaires",
  homeGlobeSnippetFallback: "Actualité de la communauté",
} satisfies Partial<WebsiteMessages>;
