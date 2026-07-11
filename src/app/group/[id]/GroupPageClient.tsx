"use client";

import Image from "next/image";
import Link from "next/link";
import { PawPrint, UsersRound } from "lucide-react";

import {
  AppDeepLinkButton,
  Badge,
  Card,
  CardContent,
  buttonClassName,
} from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

type GroupPageClientProps = {
  id: string;
  group: {
    name: string;
    avatar_url: string | null;
  };
  memberCount: number;
};

export default function GroupPageClient({
  id,
  group,
  memberCount,
}: GroupPageClientProps) {
  const { loader, t } = useRouteTranslations();
  const memberLabel = t(
    memberCount === 1 ? "groupPageMember" : "groupPageMembers",
  ).replace("{count}", String(memberCount));

  return (
    <section className="deep-page-shell bg-paw-page px-4 pb-16 pt-24 text-paw-ink sm:px-6 sm:pb-24 sm:pt-28">
      {loader}
      <Card className="mx-auto max-w-3xl text-center">
        <CardContent className="p-paw-xl sm:p-paw-xxl">
        <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-paw-xl bg-paw-primary-soft text-paw-on-primary-soft shadow-paw-panel">
          {group.avatar_url ? (
            <Image
              src={group.avatar_url}
              alt={group.name}
              fill
              sizes="96px"
              unoptimized
              priority
              className="object-cover"
            />
          ) : (
            <UsersRound className="m-7 h-10 w-10" />
          )}
        </div>
        <Badge tone="primary" className="mt-6">{t("groupPageInviteBadge")}</Badge>
        <h1 className="mt-2 font-brand text-3xl font-extrabold sm:text-4xl">
          {group.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-paw-body">
          {t("groupPageDescription")}
        </p>

        <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3 rounded-paw-xl border border-paw-outline-variant bg-paw-panel-subtle px-paw-md py-paw-sm text-sm font-bold text-paw-body shadow-paw-panel">
          <PawPrint className="h-4 w-4 text-paw-on-primary-soft" />
          {memberLabel}
        </div>

        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3">
          <AppDeepLinkButton href={`pawpal://group/${id}`} fallbackHref={`/group/${id}`} />
          <Link
            href="/"
            className={buttonClassName({ variant: "secondary", size: "lg" })}
          >
            {t("groupPageInstallPawPal")}
          </Link>
        </div>
        </CardContent>
      </Card>
    </section>
  );
}
