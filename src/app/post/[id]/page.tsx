import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, PawPrint, Share2, ThumbsUp } from "lucide-react";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { AppDeepLinkButton } from "@/components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ProfileRow = {
  display_name?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

async function loadPost(id: string) {
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post || error) return null;

  const [{ data: profile }, { data: images }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, full_name, username, avatar_url")
      .eq("id", post.user_id ?? post.author_id)
      .maybeSingle(),
    supabase
      .from("post_images")
      .select("url, sort_order")
      .eq("post_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    post,
    profile: profile as ProfileRow | null,
    images: (images ?? []) as Array<{ url: string; sort_order?: number | null }>,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadPost(id);
  if (!data) return { title: "PawPal Post" };

  const title = "PawPal Post";
  const description = String(data.post.content ?? "").slice(0, 150);
  const image =
    data.images[0]?.url ?? data.post.image_url ?? data.post.walk_map_image_url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      url: `https://pawpal.be/post/${id}`,
    },
  };
}

export default async function SharedPostPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadPost(id);
  if (!data) return notFound();

  const { post, profile, images } = data;
  const heroUrl = images[0]?.url ?? post.image_url ?? post.walk_map_image_url ?? null;
  const authorName =
    profile?.display_name ?? profile?.full_name ?? profile?.username ?? "PawPal member";
  const category = post.category ? String(post.category).replaceAll("_", " ") : "community";

  return (
    <section className="bg-paw-page px-4 py-10 text-paw-ink sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <article className="overflow-hidden rounded-paw-lg border border-paw-border bg-paw-panel shadow-paw-panel">
          {heroUrl ? (
            <div className="relative aspect-[4/3] w-full bg-paw-panel-subtle">
              <Image
                src={heroUrl}
                alt="Shared PawPal post"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-paw-primary-soft">
              <PawPrint className="h-16 w-16 text-paw-primary" />
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
                    className="object-cover"
                  />
                ) : (
                  <PawPrint className="m-2.5 h-6 w-6 text-paw-primary" />
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
                <ThumbsUp className="h-4 w-4" />
                {post.likes_count ?? post.like_count ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                {post.comments_count ?? post.comment_count ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Share2 className="h-4 w-4" />
                Share
              </span>
            </div>
          </div>
        </article>

        <aside className="rounded-paw-lg border border-paw-border bg-paw-panel p-6 shadow-paw-panel">
          <p className="text-xs font-extrabold uppercase tracking-wide text-paw-primary">
            Open in PawPal
          </p>
          <h1 className="mt-2 font-brand text-3xl font-extrabold leading-tight">
            Continue the conversation in the app.
          </h1>
          <p className="mt-3 text-sm leading-6 text-paw-body">
            If PawPal is installed, the link opens directly in the app. If not,
            you can preview it here and install PawPal to like, comment, or message.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <AppDeepLinkButton href={`pawpal://post/${id}`} fallbackHref={`/post/${id}`} />
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-paw-md border border-paw-border bg-paw-panel-subtle px-5 text-sm font-extrabold text-paw-ink transition hover:border-paw-primary"
            >
              Install PawPal
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
