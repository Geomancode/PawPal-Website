import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { publicPageMetadata } from "@/app/metadata";
import { loadP2W2PostFixture } from "@/lib/p2w2DynamicRouteFixtures";
import PostPageClient from "./PostPageClient";

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
  const fixture = await loadP2W2PostFixture(id);
  if (fixture) return fixture;

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!post) return null;

  const [
    { data: profile, error: profileError },
    { data: images, error: imagesError },
  ] = await Promise.all([
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

  if (profileError) throw profileError;
  if (imagesError) throw imagesError;

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
  const content = String(data.post.content ?? "").trim();
  const description = content
    ? content.slice(0, 150)
    : "Preview a public PawPal community post and continue the conversation in the app.";

  return publicPageMetadata({
    title,
    description,
    path: `/post/${id}`,
    type: "article",
  });
}

export default async function SharedPostPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadPost(id);
  if (!data) return notFound();

  return <PostPageClient id={id} {...data} />;
}
