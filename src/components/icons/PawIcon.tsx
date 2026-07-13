import type { ComponentPropsWithoutRef } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  HeartPulse,
  Home,
  Inbox,
  Info,
  LogOut,
  Mail,
  Map,
  Menu,
  Radio,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  TriangleAlert,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * PawPal semantic icon contract. Keep semantic names stable; glyph changes belong here.
 *
 * info -> Info; success -> CheckCircle2; warning -> TriangleAlert;
 * critical -> AlertCircle; empty -> Inbox; live -> Radio; close -> X;
 * menu -> Menu; forward -> ArrowRight; home -> Home; map -> Map;
 * account -> UserCircle; logout -> LogOut; retry -> RotateCcw; mail -> Mail;
 * nfcScan -> ScanLine; appLink -> Smartphone; check -> Check;
 * cart -> ShoppingBag; star -> Star; health -> HeartPulse; shield -> ShieldCheck.
 */
export type PawIconName =
  | "info"
  | "success"
  | "warning"
  | "critical"
  | "empty"
  | "live"
  | "close"
  | "menu"
  | "forward"
  | "home"
  | "map"
  | "account"
  | "logout"
  | "retry"
  | "mail"
  | "nfcScan"
  | "appLink"
  | "check"
  | "cart"
  | "star"
  | "health"
  | "shield";

const semanticIconMap = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  critical: AlertCircle,
  empty: Inbox,
  live: Radio,
  close: X,
  menu: Menu,
  forward: ArrowRight,
  home: Home,
  map: Map,
  account: UserCircle,
  logout: LogOut,
  retry: RotateCcw,
  mail: Mail,
  nfcScan: ScanLine,
  appLink: Smartphone,
  check: Check,
  cart: ShoppingBag,
  star: Star,
  health: HeartPulse,
  shield: ShieldCheck,
} satisfies Record<PawIconName, LucideIcon>;

type PawIconProps = {
  name: PawIconName;
} & Pick<ComponentPropsWithoutRef<"svg">, "className" | "aria-hidden">;

export default function PawIcon({
  name,
  "aria-hidden": ariaHidden = true,
  ...props
}: PawIconProps) {
  const Icon = semanticIconMap[name];
  return <Icon {...props} aria-hidden={ariaHidden} />;
}
