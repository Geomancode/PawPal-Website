"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PawIcon from "@/components/icons/PawIcon";
import { saveOrder, saveCart, loadOrders, loadCart } from "@/app/store/storeData";
import { checkoutOrderId, isPaidSession, recordPaidCheckout, type CheckoutSession } from "@/lib/checkoutCompletion";
import { Badge, Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { loadP3B1g1AccountFixtures } from "@/lib/p3b1g1AccountFixtures";

const ACCOUNT_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G1_ACCOUNT_FIXTURES === "1";
const MISSING_SESSION_ERROR = "missing-session-id";
const UNCONFIRMED_PAYMENT = "payment-not-confirmed";


function LoadingState() {
  const { loader, t } = useRouteTranslations();

  return (
    <div className="commerce-page-shell flex min-h-screen items-center justify-center bg-paw-page text-paw-ink">
      {loader}
      <div className="flex flex-col items-center gap-4">
        <PawIcon name="spinner" className="h-8 w-8 animate-spin text-paw-primary" aria-hidden="true" />
        <p className="text-paw-type-body font-bold text-paw-muted">{t("successConfirmingPayment")}</p>
      </div>
    </div>
  );
}

function SuccessContent() {
  const { loader, t } = useRouteTranslations();
  const router = useRouter();
  const { path } = useI18n();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(() => Boolean(sessionId) || ACCOUNT_FIXTURES_ENABLED);
  const [error, setError] = useState(() => sessionId || ACCOUNT_FIXTURES_ENABLED ? "" : MISSING_SESSION_ERROR);
  const [orderId, setOrderId] = useState(() => sessionId ? checkoutOrderId(sessionId) : "");
  const [receiptWarning, setReceiptWarning] = useState(false);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null);
  const isSubscription =
    session?.mode === "subscription" ||
    session?.metadata?.intent === "ai-upgrade";

  useEffect(() => {
    if (ACCOUNT_FIXTURES_ENABLED) {
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        const fixture = loadP3B1g1AccountFixtures().success;
        setOrderId(fixture.orderId);
        setSession(fixture.session);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    if (!sessionId) {
      return;
    }

    const controller = new AbortController();
    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error) throw new Error("session-verification-failed");
        return data as CheckoutSession;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setResolvedSessionId(sessionId);
        setReceiptWarning(false);
        if (!isPaidSession(data, sessionId)) {
          setError(UNCONFIRMED_PAYMENT);
        } else {
          setSession(data);
          setError("");
          setOrderId(checkoutOrderId(data.id));
          try {
            recordPaidCheckout(data, sessionId, { loadCart, loadOrders, saveOrder, saveCart });
          } catch {
            // Payment is verified independently of local receipt storage.
            setReceiptWarning(true);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResolvedSessionId(sessionId);
          setError("session-verification-failed");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [sessionId]);

  if ((ACCOUNT_FIXTURES_ENABLED && loading) || (!ACCOUNT_FIXTURES_ENABLED && sessionId && resolvedSessionId !== sessionId)) {
    return <LoadingState />;
  }

  const displayError = !sessionId && !ACCOUNT_FIXTURES_ENABLED ? MISSING_SESSION_ERROR : error;
  if (displayError) {
    return (
      <div className="commerce-page-shell success-status-shell flex min-h-[100dvh] items-start justify-center bg-paw-page px-paw-md pb-16 pt-28 text-paw-ink sm:px-paw-xl lg:px-paw-xxl">
        {loader}
        <Card className="success-card-upgraded w-full max-w-lg p-7 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-paw-xl bg-paw-critical-soft text-paw-on-critical-soft">
            <PawIcon name="warning" className="h-7 w-7" aria-hidden="true" />
          </div>
          <Badge tone="critical" className="mb-3">{t("successCheckoutStatus")}</Badge>
          <h1 className="text-paw-type-h2 font-extrabold text-paw-ink">{displayError === UNCONFIRMED_PAYMENT ? t("successPaymentUnconfirmedTitle") : t("successVerificationFailedTitle")}</h1>
          <p className="mt-3 text-paw-type-body leading-6 text-paw-body">{displayError === MISSING_SESSION_ERROR ? t("successNoSessionId") : displayError === UNCONFIRMED_PAYMENT ? t("successPaymentUnconfirmedCopy") : t("successVerificationExplanation")}</p>
          <div className="mt-5 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4 text-left">
            <p className="text-paw-type-caption font-black uppercase tracking-[0.14em] text-paw-muted">{t("successWhatThisMeans")}</p>
            <p className="mt-2 text-paw-type-body leading-6 text-paw-body">
              {t("successVerificationExplanation")}
            </p>
          </div>
          <div className="success-action-row mt-6">
            <Button type="button" onClick={() => router.push(path("/store"))}>
              {t("successBackToStore")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(path("/store/orders"))}>
              {t("successViewOrders")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="commerce-page-shell min-h-screen bg-paw-page pt-28 pb-20 text-paw-ink">
      {loader}
      <div className="mx-auto max-w-2xl px-4">
        <Card className="success-card-upgraded p-8 text-center sm:p-10">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-paw-pill bg-paw-success-soft text-paw-on-success-soft">
            <PawIcon name="success" className="h-12 w-12" aria-hidden="true" />
          </div>

          <Badge tone="success" className="mb-3">{t("successPaymentConfirmed")}</Badge>
          <h1 className="text-paw-type-h1 font-extrabold text-paw-ink">
            {isSubscription ? t("successPlanActivated") : t("successPaymentSuccessful")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-paw-body">
            {isSubscription
              ? t("successSubscriptionDescription")
              : t("successPurchaseThanks")}
          </p>

          {receiptWarning && <p role="status" className="mt-4 text-paw-body">{t("successReceiptStorageWarning")}</p>}

          {isSubscription ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-paw-pill border border-paw-primary/20 bg-paw-primary-soft px-4 py-2 text-paw-type-body font-extrabold text-paw-on-primary-soft">
              <PawIcon name="sparkle" className="h-4 w-4" aria-hidden="true" />
              {session?.metadata?.tier === "pro" ? t("successPlanProLabel") : t("successPlanBasicLabel")}
            </div>
          ) : (
            <div className="mt-5 inline-flex items-center gap-2 rounded-paw-pill border border-paw-primary/20 bg-paw-primary-soft px-4 py-2 break-all font-mono text-paw-type-body font-extrabold text-paw-on-primary-soft">
              <PawIcon name="receipt" className="h-4 w-4" aria-hidden="true" />
              {t("successOrderNumberPrefix")}#{orderId}
            </div>
          )}

          {session && (
            <div className="mt-7 space-y-4 text-left">
              <div className="rounded-paw-md border border-paw-success/20 bg-paw-success-soft p-4 text-center">
                <p className="text-paw-type-body text-paw-on-success-soft">
                  {t("successPaidPrefix")} <strong>€{((session.amount_total || 0) / 100).toFixed(2)}</strong> {t("successViaStripeSuffix")}
                </p>
              </div>

              {session.line_items && session.line_items.length > 0 && (
                <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
                  <h2 className="mb-3 flex items-center gap-2 text-paw-type-body font-extrabold text-paw-ink">
                    <PawIcon name="package" className="h-4 w-4 text-paw-primary" aria-hidden="true" />
                    {t("successItemsTitle")}
                  </h2>
                  <div className="space-y-2">
                    {session.line_items.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-paw-type-body">
                        <span className="text-paw-body">{item.name} × {item.quantity}</span>
                        <span className="font-extrabold text-paw-ink">€{(item.amount / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSubscription ? (
                <div className="rounded-paw-md border border-paw-trust/20 bg-paw-trust-soft p-4">
                  <p className="text-paw-type-body leading-6 text-paw-on-trust-soft">
                    {t("successRefreshPlanPrefix")} <strong>{t("successRefreshPlanAction")}</strong> {t("successRefreshPlanSuffix")}
                  </p>
                </div>
              ) : (
                <div className="rounded-paw-md border border-paw-warning/20 bg-paw-warning-soft p-4">
                  <p className="text-paw-type-body leading-6 text-paw-on-warning-soft">
                    {t("successReceiptSentPrefix")} <strong>{session.customer_email}</strong>{t("successShippingEstimateSuffix")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {isSubscription ? (
              <Button type="button" onClick={() => router.push(path("/store?intent=ai-upgrade"))}>
                {t("successManagePlans")}
                <PawIcon name="forward" className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" onClick={() => router.push(path("/store/orders"))}>
                {t("successViewMyOrders")}
                <PawIcon name="forward" className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => router.push(path("/store"))}>
              {t("successContinueShopping")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  );
}
