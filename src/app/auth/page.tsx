"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import PawIcon from "@/components/icons/PawIcon";
import PawPalLogo from "@/components/PawPalLogo";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  StatusMessage,
} from "@/components/ui";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { useI18n } from "@/i18n/I18nProvider";

export default function AuthPage() {
  const { path } = useI18n();
  const { loader, t } = useRouteTranslations();
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // If already logged in, go straight to the usable account surface.
  useEffect(() => {
    if (user) router.replace(path("/profile"));
  }, [path, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!email.includes("@")) { setError(t("authInvalidEmail")); return; }
    if (password.length < 6) { setError(t("authPasswordTooShort")); return; }
    if (!isLogin && password !== confirmPassword) { setError(t("authPasswordsDoNotMatch")); return; }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        router.push(path("/profile"));
      }
    } else {
      const { error, needsConfirm } = await signUp(email, password, fullName || undefined);
      if (error) {
        setError(error);
      } else if (needsConfirm) {
        setSuccess(t("authAccountCreated"));
        setIsLogin(true);
        setPassword("");
      } else {
        router.push(path("/profile"));
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page-shell min-h-screen px-paw-md pt-24 pb-12 bg-paw-page sm:px-paw-xl lg:px-paw-xxl">
      {loader}
      <div className="auth-layout mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
        <aside className="auth-visual-panel hidden lg:block">
          <div className="relative z-10">
            <Badge tone="primary" variant="semantic">
              <PawIcon name="sparkle" className="h-4 w-4" aria-hidden="true" />
              {t("authBadge")}
            </Badge>
            <h1 className="mt-5 max-w-xl text-paw-type-display font-extrabold leading-tight text-paw-ink">
              {t("authHeroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-paw-type-body leading-7 text-paw-body">
              {t("authHeroCopy")}
            </p>
          </div>
          <div className="auth-signal-grid relative z-10 mt-8">
            {[
              { icon: "nfc" as const, title: t("authSignalNfcTitle"), copy: t("authSignalNfcCopy") },
              { icon: "map" as const, title: t("authSignalMapTitle"), copy: t("authSignalMapCopy") },
              { icon: "shield" as const, title: t("authSignalPrivacyTitle"), copy: t("authSignalPrivacyCopy") },
            ].map((item) => (
              <div key={item.title} className="auth-signal-card">
                <PawIcon name={item.icon} className="h-5 w-5 text-paw-on-primary-soft" aria-hidden="true" />
                <div>
                  <p className="text-paw-type-body font-extrabold text-paw-ink">{item.title}</p>
                  <p className="mt-1 text-paw-type-caption leading-5 text-paw-body">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

      <div className="w-full max-w-md justify-self-center lg:justify-self-end">
        <Card
          variant="hero"
          className="auth-card bg-paw-panel-low/95 p-0 backdrop-blur-xl"
        >
          <CardContent className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mb-3 flex justify-center">
              <PawPalLogo iconOnly iconSize={56} variant="light" priority />
            </div>
            <h2 className="text-paw-type-h2 font-bold text-paw-ink">
              {isLogin ? t("authWelcomeBackTitle") : t("authJoinTitle")}
            </h2>
            <p className="text-paw-muted text-paw-type-body mt-1">
              {isLogin ? t("authWelcomeBackCopy") : t("authJoinCopy")}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-1 bg-paw-panel-subtle rounded-paw-md p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              aria-pressed={isLogin}
              className={`auth-mode-tab flex-1 py-2 rounded-paw-sm text-paw-type-body font-semibold transition-all ${
                isLogin ? "bg-paw-panel text-paw-ink shadow-sm" : "text-paw-muted hover:text-paw-body"
              }`}
            >
              {t("authSignInTab")}
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              aria-pressed={!isLogin}
              className={`auth-mode-tab flex-1 py-2 rounded-paw-sm text-paw-type-body font-semibold transition-all ${
                !isLogin ? "bg-paw-panel text-paw-ink shadow-sm" : "text-paw-muted hover:text-paw-body"
              }`}
            >
              {t("authSignUpTab")}
            </button>
          </div>

          {/* Error/Success banners */}
          {error && (
            <StatusMessage
              id="auth-error"
              tone="critical"
              variant="compact"
              className="mb-4"
            >
              {error}
            </StatusMessage>
          )}
          {success && (
            <StatusMessage
              id="auth-success"
              tone="success"
              variant="compact"
              className="mb-4"
            >
              {success}
            </StatusMessage>
          )}

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
            aria-describedby={error ? "auth-error" : success ? "auth-success" : undefined}
          >
            {!isLogin && (
              <Input
                id="auth-display-name"
                label={t("authDisplayNameLabel")}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("authDisplayNamePlaceholder")}
                leftSlot={<PawIcon name="user" className="h-4 w-4" aria-hidden="true" />}
              />
            )}

            <Input
              id="auth-email"
              label={t("authEmailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("authEmailPlaceholder")}
              required
              aria-invalid={Boolean(error && !email.includes("@"))}
              leftSlot={<PawIcon name="mail" className="h-4 w-4" aria-hidden="true" />}
            />

            <Input
              id="auth-password"
              label={t("authPasswordLabel")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("authPasswordPlaceholder")}
              required
              aria-invalid={Boolean(error && password.length > 0 && password.length < 6)}
              className="pr-16"
              leftSlot={<PawIcon name="secure" className="h-4 w-4" aria-hidden="true" />}
              rightSlot={
                <button
                  type="button"
                  aria-label={showPassword ? t("authHidePassword") : t("authShowPassword")}
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle rounded-paw-sm p-1 text-paw-muted transition hover:bg-paw-panel-subtle hover:text-paw-ink"
                >
                  {showPassword ? <PawIcon name="hide" className="h-4 w-4" /> : <PawIcon name="show" className="h-4 w-4" />}
                </button>
              }
            />

            {!isLogin && (
              <Input
                id="auth-confirm-password"
                label={t("authConfirmPasswordLabel")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("authConfirmPasswordPlaceholder")}
                required
                aria-invalid={Boolean(error && !isLogin && confirmPassword.length > 0 && password !== confirmPassword)}
                leftSlot={<PawIcon name="secure" className="h-4 w-4" aria-hidden="true" />}
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <PawIcon name="spinner" className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  {isLogin ? t("authSignInTab") : t("authCreateAccountButton")}
                  <PawIcon name="forward" className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="auth-trust-panel mt-6">
            <div className="flex items-start gap-3">
              <span className="auth-trust-icon">
                <PawIcon name="shield" className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-paw-type-body font-extrabold text-paw-ink">{t("authTrustTitle")}</p>
                <p className="mt-1 text-paw-type-caption leading-5 text-paw-body">
                  {t("authTrustCopy")}
                </p>
              </div>
            </div>
            <div className="auth-trust-list" aria-label={t("authTrustChecksLabel")}>
              <span><PawIcon name="nfc" className="h-3.5 w-3.5" aria-hidden="true" /> {t("authTagControls")}</span>
              <span><PawIcon name="secure" className="h-3.5 w-3.5" aria-hidden="true" /> {t("authPrivateOwnerDetails")}</span>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-paw-type-caption text-paw-muted mt-6">
          {t("authContinuePrefix")}{" "}
          <a href={path("/terms")} className="auth-legal-link text-paw-primary hover:underline">{t("authTerms")}</a>{" "}
          {t("authAnd")}{" "}
          <a href={path("/privacy")} className="auth-legal-link text-paw-primary hover:underline">{t("authPrivacyPolicy")}</a>
        </p>
      </div>
      </div>
    </div>
  );
}
