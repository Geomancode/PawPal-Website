import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/ui";

export default function PawPalLogo({
  href = "/",
  inverse = false,
  className,
}: {
  href?: string;
  inverse?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-paw-md bg-white shadow-paw-panel">
        <Image
          src="/assets/logos/pawpal-logo.svg"
          alt="PawPal"
          width={30}
          height={30}
          priority
        />
      </span>
      <span
        className={cn(
          "text-xl font-extrabold",
          inverse ? "text-white" : "text-paw-ink",
        )}
      >
        PawPal<span className="text-paw-accent">.</span>
      </span>
    </>
  );

  if (!href) {
    return <span className={cn("flex items-center gap-2", className)}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 hover:opacity-85 transition-opacity", className)}
    >
      {content}
    </Link>
  );
}
