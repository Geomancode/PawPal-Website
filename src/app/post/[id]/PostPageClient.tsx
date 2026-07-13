"use client";

import Image from "next/image";
import Link from "next/link";
import PawIcon from "@/components/icons/PawIcon";

import { AppDeepLinkButton } from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

type PostPageClientProps = {
  id: string;
  post: {
    content?: string | null;
    category?: string | null;
    image_url?: string | null;
    walk_map_image_url?: string | null;
    likes_count?: number | null;
    like_count?: number | null;
    comments_count?: number | null;
    comment_count?: number | null;
  };
  profile: {
    display_name?: string | null;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  images: Array<{ url: string; sort_order?: number | null }>;
};

export default function PostPageClient({
  id,
  post,
  profile,
  images,
}: PostPageClientProps) {
  const { loader, t } = useRouteTranslations();
  const heroUrl = images[0]?.url ?? post.image_url ?? post.walk_map_image_url ?? null;
  const authorName =
    profile?.display_name ??
    profile?.full_name ??
    profile?.username ??
    t("postPageMemberFallback");
  const category = post.category
    ? String(post.category).replaceAll("_", " ")
    : t("postPageCategoryFallback");

  return (
    <section className="bg-paw-page px-paw-md pb-10 pt-24 text-paw-ink sm:px-paw-xl sm:pb-14 sm:pt-28 lg:px-paw-xxl">
      {loader}
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <article className="overflow-hidden rounded-paw-lg border border-paw-border bg-paw-panel shadow-paw-panel">
          {heroUrl ? (
            <div className="relative aspect-[4/3] w-full bg-paw-panel-subtle">
              <Image
                src={heroUrl}
                alt={t("postPageImageAlt")}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                unoptimized
                priority
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-paw-primary-soft">
              <PawIcon name="paw" className="h-16 w-16 text-paw-primary" />
            </div>
          )}
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-paw-primary-soft">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={authorName}
                    fill
                    sizes="44px"
                    unoptimized
                    loading="lazy"
                    className="object-cover"
                  />
                ) : (
                  <PawIcon name="paw" className="m-2.5 h-6 w-6 text-paw-primary" />
                )}
              </div>
              <div>
                <p className="font-extrabold">{authorName}</p>
                <p className="text-sm capitalize text-paw-muted">{category}</p>
              </div>
            </div>
            <p className="whitespace-pre-line text-base leading-7 text-paw-body">
              {post.content}
            </p>
            <div className="flex gap-5 border-t border-paw-border pt-4 text-sm font-bold text-paw-muted">
              <span className="inline-flex items-center gap-1.5">
                <PawIcon name="thumbsUp" className="h-4 w-4" />
                {post.likes_count ?? post.like_count ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PawIcon name="chat" className="h-4 w-4" />
                {post.comments_count ?? post.comment_count ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PawIcon name="share" className="h-4 w-4" />
                {t("postPageShare")}
              </span>
            </div>
          </div>
        </article>

        <aside className="rounded-paw-lg border border-paw-border bg-paw-panel p-6 shadow-paw-panel">
          <p className="text-xs font-extrabold uppercase tracking-wide text-paw-primary">
            {t("postPageOpenInPawPal")}
          </p>
          <h1 className="mt-2 font-brand text-3xl font-extrabold leading-tight">
            {t("postPageContinueConversation")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-paw-body">
            {t("postPageOpenDescription")}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <AppDeepLinkButton href={`pawpal://post/${id}`} fallbackHref={`/post/${id}`} />
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel-subtle px-5 text-sm font-extrabold text-paw-ink transition hover:border-paw-primary"
            >
              {t("postPageInstallPawPal")}
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
