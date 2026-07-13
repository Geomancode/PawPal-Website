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
  Navigation,
  Droplets,
  Wind,
  Dog,
  WifiOff,
  CloudSnow,
  Users,
  CloudRain,
  Thermometer,
  CloudLightning,
  Sun,
  CloudFog,
  Store,
  Cloud,
  Route,
  ChevronLeft,
  PawPrint,
  CheckCircle,
  MessageCircle,
  Bot,
  LockKeyhole,
  BookOpen,
  LifeBuoy,
  HeartHandshake,
  Languages,
  Footprints,
  FileCheck2,
  FileText,
  XCircle,
  Edit3,
  UserCircle2,
  Download,
  ShieldAlert,
  ClipboardList,
  Shield,
  Calendar,
  PlusCircle,
  BellRing,
  Nfc,
  BellOff,
  MessageSquare,
  Bell,
  Globe2,
  Ban,
  Award,
  MapPinned,
  BadgeCheck,
  MessageSquareWarning,
  Clock3,
  Phone,
  Cookie,
  ReceiptText,
  Database,
  Scale,
  Eye,
  Share2,
  EyeOff,
  Siren,
  Flag,
  ThumbsUp,
  Globe,
  User,
  GraduationCap,
  UserRound,
  Handshake,
  UsersRound,
  Heart,
  Zap,
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
  | "chevronDown"
  | "navigate"
  | "humidity"
  | "wind"
  | "dog"
  | "offline"
  | "snow"
  | "community"
  | "rain"
  | "temperature"
  | "storm"
  | "sun"
  | "fog"
  | "shop"
  | "cloud"
  | "route"
  | "chevronLeft"
  | "paw"
  | "confirm"
  | "chat"
  | "assistant"
  | "privacy"
  | "guide"
  | "support"
  | "care"
  | "language"
  | "footprints"
  | "fileApproved"
  | "document"
  | "dismiss"
  | "edit"
  | "profile"
  | "download"
  | "safetyAlert"
  | "checklist"
  | "safety"
  | "calendar"
  | "addCircle"
  | "notifyActive"
  | "nfc"
  | "notifyOff"
  | "comment"
  | "notify"
  | "globe"
  | "ban"
  | "award"
  | "locationPinned"
  | "verified"
  | "commentWarning"
  | "schedule"
  | "phone"
  | "cookie"
  | "receiptDetail"
  | "database"
  | "legal"
  | "show"
  | "share"
  | "hide"
  | "emergency"
  | "flag"
  | "thumbsUp"
  | "world"
  | "user"
  | "education"
  | "person"
  | "partnership"
  | "people"
  | "heart"
  | "energy";

export type PawIconComponent = LucideIcon;

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
  navigate: Navigation,
  humidity: Droplets,
  wind: Wind,
  dog: Dog,
  offline: WifiOff,
  snow: CloudSnow,
  community: Users,
  rain: CloudRain,
  temperature: Thermometer,
  storm: CloudLightning,
  sun: Sun,
  fog: CloudFog,
  shop: Store,
  cloud: Cloud,
  route: Route,
  chevronLeft: ChevronLeft,
  paw: PawPrint,
  confirm: CheckCircle,
  chat: MessageCircle,
  assistant: Bot,
  privacy: LockKeyhole,
  guide: BookOpen,
  support: LifeBuoy,
  care: HeartHandshake,
  language: Languages,
  footprints: Footprints,
  fileApproved: FileCheck2,
  document: FileText,
  dismiss: XCircle,
  edit: Edit3,
  profile: UserCircle2,
  download: Download,
  safetyAlert: ShieldAlert,
  checklist: ClipboardList,
  safety: Shield,
  calendar: Calendar,
  addCircle: PlusCircle,
  notifyActive: BellRing,
  nfc: Nfc,
  notifyOff: BellOff,
  comment: MessageSquare,
  notify: Bell,
  globe: Globe2,
  ban: Ban,
  award: Award,
  locationPinned: MapPinned,
  verified: BadgeCheck,
  commentWarning: MessageSquareWarning,
  schedule: Clock3,
  phone: Phone,
  cookie: Cookie,
  receiptDetail: ReceiptText,
  database: Database,
  legal: Scale,
  show: Eye,
  share: Share2,
  hide: EyeOff,
  emergency: Siren,
  flag: Flag,
  thumbsUp: ThumbsUp,
  world: Globe,
  user: User,
  education: GraduationCap,
  person: UserRound,
  partnership: Handshake,
  people: UsersRound,
  heart: Heart,
  energy: Zap,
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
