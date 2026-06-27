"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Map,
  Nfc,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import PawPalLogo from "@/components/PawPalLogo";
import { useRouter } from "next/navigation";
import { DoodleDog, DoodlePaw, DoodleHeart } from "@/components/PetDoodles";

export default function AuthPage() {
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
    if (user) router.replace("/profile");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!isLogin && password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        router.push("/profile");
      }
    } else {
      const { error, needsConfirm } = await signUp(email, password, fullName || undefined);
      if (error) {
        setError(error);
      } else if (needsConfirm) {
        setSuccess("Account created! Please check your email to confirm, then sign in.");
        setIsLogin(true);
        setPassword("");
      } else {
        router.push("/profile");
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page-shell min-h-screen px-4 pt-24 pb-12 bg-paw-page">
      {/* Pet doodles */}
      <div className="absolute top-[15%] left-[8%] w-24 h-24 text-paw-primary/10 doodle-float hidden lg:block"><DoodleDog className="w-full h-full" /></div>
      <div className="absolute bottom-[20%] right-[10%] w-16 h-16 text-paw-primary/10 doodle-float-alt hidden lg:block" style={{ animationDelay: '2s' }}><DoodlePaw className="w-full h-full" /></div>
      <div className="absolute top-[60%] left-[5%] w-12 h-12 text-paw-trust/10 doodle-float hidden lg:block" style={{ animationDelay: '4s' }}><DoodleHeart className="w-full h-full" /></div>

      <div className="auth-layout mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
        <aside className="auth-visual-panel hidden lg:block">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-paw-md border border-white/45 bg-white/72 px-3 py-1.5 text-sm font-extrabold text-paw-primary shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              PawPal account
            </div>
            <h1 className="mt-5 max-w-xl text-5xl font-extrabold leading-tight text-paw-ink">
              One login for walks, tags, rescue pages, and store orders.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-paw-body">
              Keep pet profiles, finder visibility, map activity, and community
              support tied to a single secure account.
            </p>
          </div>
          <div className="auth-signal-grid relative z-10 mt-8">
            {[
              { icon: Nfc, title: "Tag setup", copy: "Control finder pages after a real tag is paired." },
              { icon: Map, title: "Walk context", copy: "Map features and nearby help stay attached to your profile." },
              { icon: ShieldCheck, title: "Privacy first", copy: "Owner details stay hidden until you choose to share." },
            ].map((item) => (
              <div key={item.title} className="auth-signal-card">
                <item.icon className="h-5 w-5 text-paw-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-extrabold text-paw-ink">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-paw-body">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

      <div className="w-full max-w-md justify-self-center lg:justify-self-end">
        {/* Card */}
        <div className="auth-card bg-paw-panel/90 backdrop-blur-xl rounded-paw-lg p-8 border border-paw-border shadow-paw-panel">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mb-3 flex justify-center">
              <PawPalLogo iconOnly iconSize={56} variant="light" />
            </div>
            <h1 className="text-2xl font-bold text-paw-ink">
              {isLogin ? "Welcome Back" : "Join PawPal"}
            </h1>
            <p className="text-paw-muted text-sm mt-1">
              {isLogin ? "Access profiles, tags, and orders securely" : "Create one account for pet safety and orders"}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-1 bg-paw-panel-subtle rounded-paw-md p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              aria-pressed={isLogin}
              className={`flex-1 py-2 rounded-paw-sm text-sm font-semibold transition-all ${
                isLogin ? "bg-paw-panel text-paw-ink shadow-sm" : "text-paw-muted hover:text-paw-body"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              aria-pressed={!isLogin}
              className={`flex-1 py-2 rounded-paw-sm text-sm font-semibold transition-all ${
                !isLogin ? "bg-paw-panel text-paw-ink shadow-sm" : "text-paw-muted hover:text-paw-body"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error/Success banners */}
          {error && (
            <div
              id="auth-error"
              className="flex items-center gap-2 bg-paw-danger-soft border border-paw-danger/20 text-paw-danger text-sm px-4 py-3 rounded-paw-md mb-4"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div
              id="auth-success"
              className="flex items-center gap-2 bg-paw-success-soft border border-paw-success/20 text-paw-success text-sm px-4 py-3 rounded-paw-md mb-4"
              role="status"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
            aria-describedby={error ? "auth-error" : success ? "auth-success" : undefined}
          >
            {!isLogin && (
              <div>
                <label htmlFor="auth-display-name" className="block text-sm font-medium text-paw-body mb-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-muted" />
                  <input
                    id="auth-display-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full pl-10 pr-4 py-3 rounded-paw-md bg-paw-panel-subtle border border-paw-border text-paw-ink placeholder-paw-muted focus:outline-none focus:ring-4 focus:ring-paw-trust/15 focus:border-paw-trust transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-paw-body mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-muted" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  aria-invalid={Boolean(error && !email.includes("@"))}
                  className="w-full pl-10 pr-4 py-3 rounded-paw-md bg-paw-panel-subtle border border-paw-border text-paw-ink placeholder-paw-muted focus:outline-none focus:ring-4 focus:ring-paw-trust/15 focus:border-paw-trust transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-paw-body mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-muted" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  aria-invalid={Boolean(error && password.length > 0 && password.length < 6)}
                  className="w-full pl-10 pr-12 py-3 rounded-paw-md bg-paw-panel-subtle border border-paw-border text-paw-ink placeholder-paw-muted focus:outline-none focus:ring-4 focus:ring-paw-trust/15 focus:border-paw-trust transition-all text-sm"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-paw-muted hover:text-paw-body"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-paw-body mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-muted" />
                  <input
                    id="auth-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-invalid={Boolean(error && !isLogin && confirmPassword.length > 0 && password !== confirmPassword)}
                    className="w-full pl-10 pr-4 py-3 rounded-paw-md bg-paw-panel-subtle border border-paw-border text-paw-ink placeholder-paw-muted focus:outline-none focus:ring-4 focus:ring-paw-trust/15 focus:border-paw-trust transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-paw-primary hover:bg-paw-primary-hover disabled:bg-paw-primary/45 text-white py-3.5 rounded-paw-md font-bold text-sm transition-all shadow-paw-action hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="auth-trust-panel mt-6">
            <div className="flex items-start gap-3">
              <span className="auth-trust-icon">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-paw-ink">Email account access only</p>
                <p className="mt-1 text-xs leading-5 text-paw-body">
                  PawPal keeps profile, rescue tag, and order access tied to the email credentials submitted above.
                </p>
              </div>
            </div>
            <div className="auth-trust-list" aria-label="Account trust checks">
              <span><Nfc className="h-3.5 w-3.5" aria-hidden="true" /> Tag controls</span>
              <span><Lock className="h-3.5 w-3.5" aria-hidden="true" /> Private owner details</span>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-paw-muted mt-6">
          By continuing, you agree to PawPal&apos;s{" "}
          <a href="/terms" className="text-paw-primary hover:underline">Terms</a> and{" "}
          <a href="/privacy" className="text-paw-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
      </div>
    </div>
  );
}
