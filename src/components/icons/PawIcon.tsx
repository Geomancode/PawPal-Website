import {
  lazy,
  Suspense,
  type ComponentPropsWithoutRef,
  type LazyExoticComponent,
} from "react";
import type { MaterialGlyphComponent } from "./material-glyphs.generated";

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

export type PawIconComponent = MaterialGlyphComponent;

const materialGlyphModule = import("./material-glyphs.generated");
const deferredGlyphs = new Map<
  PawIconName,
  LazyExoticComponent<MaterialGlyphComponent>
>();

function deferredGlyph(name: PawIconName) {
  const cached = deferredGlyphs.get(name);
  if (cached) return cached;

  const Icon = lazy(() =>
    materialGlyphModule.then(({ materialGlyphs }) => ({
      default: materialGlyphs[name],
    })),
  );
  deferredGlyphs.set(name, Icon);
  return Icon;
}

const semanticIconMap = new Proxy(
  {} as Record<PawIconName, LazyExoticComponent<MaterialGlyphComponent>>,
  {
    get: (_target, name: PawIconName) => deferredGlyph(name),
  },
);

type PawIconProps = {
  name: PawIconName;
} & Pick<ComponentPropsWithoutRef<"svg">, "className" | "aria-hidden">;

export default function PawIcon({
  name,
  "aria-hidden": ariaHidden = true,
  ...props
}: PawIconProps) {
  const Icon = semanticIconMap[name];
  return (
    <Suspense
      fallback={
        <svg
          viewBox="0 -960 960 960"
          width={24}
          height={24}
          fill="currentColor"
          {...props}
          aria-hidden={ariaHidden}
        />
      }
    >
      <Icon {...props} aria-hidden={ariaHidden} />
    </Suspense>
  );
}
