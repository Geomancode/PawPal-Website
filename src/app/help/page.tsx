"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Siren,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  PageShell,
  buttonClassName,
} from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";

const LANE_DEFINITIONS = [
  {
    icon: ScanLine,
    titleKey: "helpNfcTitle",
    routeKey: "helpNfcRoute",
    textKey: "helpNfcText",
    actionKey: "helpNfcAction",
    href: "/store",
  },
  {
    icon: ShoppingBag,
    titleKey: "helpStoreTitle",
    routeKey: "helpStoreRoute",
    textKey: "helpStoreText",
    actionKey: "helpStoreAction",
    href: "/store",
  },
  {
    icon: UserRound,
    titleKey: "helpAccountTitle",
    routeKey: "helpAccountRoute",
    textKey: "helpAccountText",
    actionKey: "helpAccountAction",
    href: "mailto:hello@pawpal.be",
  },
  {
    icon: Siren,
    titleKey: "helpUrgentTitle",
    routeKey: "helpUrgentRoute",
    textKey: "helpUrgentText",
    actionKey: "helpUrgentAction",
    href: "/globe",
  },
] as const;

const ROUTE_DEFINITIONS = [
  { labelKey: "helpStepTagLabel", valueKey: "helpStepTagValue", icon: ScanLine },
  { labelKey: "helpStepStoreLabel", valueKey: "helpStepStoreValue", icon: ShoppingBag },
  { labelKey: "helpStepAccountLabel", valueKey: "helpStepAccountValue", icon: MessageCircle },
  { labelKey: "helpStepUrgentLabel", valueKey: "helpStepUrgentValue", icon: ShieldCheck },
] as const;

export default function HelpPage() {
  const { loader, t } = useRouteTranslations();

  return (
    <PageShell className="pt-28 sm:pt-32" contentClassName="space-y-paw-xl">
      {loader}
      <section className="grid gap-paw-xl lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
        <div className="support-hero-copy">
          <Badge tone="primary" variant="semantic" className="mb-paw-lg">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            {t("helpBadge")}
          </Badge>
          <h1 className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display">
            {t("helpHeroTitle")}
          </h1>
          <p className="mt-paw-md max-w-2xl text-paw-type-body text-paw-body sm:text-base">
            {t("helpHeroCopy")}
          </p>
          <div className="mt-paw-xl flex flex-wrap gap-paw-sm">
            <a
              href="mailto:hello@pawpal.be"
              className={buttonClassName({ size: "lg" })}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t("helpContactSupport")}
            </a>
            <Link
              href="/globe"
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              {t("helpOpenGlobe")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="support-route-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-paw-type-caption font-black uppercase text-paw-muted">
                {t("helpRouteEyebrow")}
              </p>
              <h2 className="mt-paw-xs text-paw-type-h2 font-black text-paw-ink">
                {t("helpRouteTitle")}
              </h2>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-paw-lg grid gap-paw-sm sm:grid-cols-2 lg:grid-cols-1">
            {ROUTE_DEFINITIONS.map((step) => (
              <div
                key={step.labelKey}
                className="support-route-step"
              >
                <step.icon className="h-4 w-4 text-paw-on-primary-soft" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-paw-muted">
                    {t(step.labelKey)}
                  </p>
                  <p className="truncate text-sm font-extrabold text-paw-ink">
                    {t(step.valueKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <div className="grid gap-paw-md md:grid-cols-2 xl:grid-cols-4">
          {LANE_DEFINITIONS.map((item) => (
            <Card
              key={item.titleKey}
              variant="panel"
              className="support-card h-full"
            >
              <CardContent className="flex h-full flex-col">
                <div className="mb-paw-md flex h-11 w-11 items-center justify-center rounded-paw-control bg-paw-primary-soft text-paw-on-primary-soft">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-paw-type-h3 font-black text-paw-ink">
                  {t(item.titleKey)}
                </h2>
                <p className="mt-paw-sm text-sm leading-6 text-paw-body">{t(item.textKey)}</p>
                <p className="mt-paw-md text-xs font-bold text-paw-muted">{t(item.routeKey)}</p>
                <a
                  href={item.href}
                  className="support-lane-action mt-auto inline-flex items-center gap-paw-xs pt-paw-md text-sm font-extrabold text-paw-on-primary-soft transition hover:text-paw-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                >
                  {t(item.actionKey)}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="support-contact-band mt-paw-xl">
          <div className="flex flex-col justify-between gap-paw-md sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-extrabold text-paw-ink">
              {t("helpContextTitle")}
            </p>
            <p className="mt-1 text-sm leading-6 text-paw-body">
              {t("helpContextCopy")}
            </p>
          </div>
          <div className="flex items-center gap-paw-xs text-sm font-bold text-paw-on-primary-soft">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {t("helpBelgiumSupport")}
          </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
