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
  Loader2,
  Search,
  Truck,
  Save,
  Package,
  Receipt,
  ArrowLeft,
  Plus,
  Sparkles,
  Minus,
  RefreshCw,
  PackagePlus,
  MapPin,
  Lock,
  CreditCard,
  ImagePlus,
  UploadCloud,
  ExternalLink,
  Trash2,
  Dumbbell,
  Tags,
  Crown,
  SlidersHorizontal,
  Clock,
  ShoppingCart,
  Bone,
  ChevronUp,
  ChevronRight,
  ChevronDown,
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
  | "shield"
  | "spinner"
  | "search"
  | "shipping"
  | "save"
  | "package"
  | "receipt"
  | "back"
  | "add"
  | "sparkle"
  | "subtract"
  | "refresh"
  | "packageAdd"
  | "location"
  | "secure"
  | "payment"
  | "imageAdd"
  | "upload"
  | "externalLink"
  | "delete"
  | "dumbbell"
  | "tags"
  | "crown"
  | "filters"
  | "clock"
  | "basket"
  | "bone"
  | "chevronUp"
  | "chevronRight"
  | "chevronDown";

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
  spinner: Loader2,
  search: Search,
  shipping: Truck,
  save: Save,
  package: Package,
  receipt: Receipt,
  back: ArrowLeft,
  add: Plus,
  sparkle: Sparkles,
  subtract: Minus,
  refresh: RefreshCw,
  packageAdd: PackagePlus,
  location: MapPin,
  secure: Lock,
  payment: CreditCard,
  imageAdd: ImagePlus,
  upload: UploadCloud,
  externalLink: ExternalLink,
  delete: Trash2,
  dumbbell: Dumbbell,
  tags: Tags,
  crown: Crown,
  filters: SlidersHorizontal,
  clock: Clock,
  basket: ShoppingCart,
  bone: Bone,
  chevronUp: ChevronUp,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
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
