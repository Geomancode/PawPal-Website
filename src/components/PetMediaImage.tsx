"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { getSupabaseConfigurationError, supabase } from "@/lib/supabase";
import { isPrivatePetMedia, observePetMedia, type PetMediaState } from "@/lib/petMediaAccess";

type Props = Omit<ImageProps, "src"> & { src: string };

export default function PetMediaImage(props: Props) {
  // Keep public legacy and ordinary assets on their original Next loader.
  return isPrivatePetMedia(props.src) ? <PrivatePetMediaImage {...props} /> : <Image {...props} alt={props.alt} />;
}

function PrivatePetMediaImage({ src, alt, ...props }: Props) {
  const image = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<PetMediaState>({ source: src, url: null, failed: false });
  useEffect(() => {
    let mounted = true;
    if (getSupabaseConfigurationError()) {
      queueMicrotask(() => {
        if (mounted) setState({ source: src, url: null, failed: true });
      });
      return () => { mounted = false; };
    }
    const resource = observePetMedia(supabase, src, (next) => {
      // Clear pixels immediately at the auth boundary, before React commits.
      if (!next.url) {
        image.current?.removeAttribute("src");
        image.current?.removeAttribute("srcset");
      }
      if (mounted) setState(next);
    });
    const visibility = () => resource.setActive(document.visibilityState !== "hidden");
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", visibility);
      resource.dispose();
    };
  }, [src]);
  const current = state.source === src ? state : null;
  if (!current?.url) {
    return <span role="img" aria-label={alt} data-pet-media-state={current?.failed ? "unavailable" : "loading"}
      className={`${props.fill ? "absolute inset-0 " : ""}${props.className ?? ""}`} />;
  }
  return <Image {...props} ref={image} src={current.url} alt={alt} unoptimized data-pet-media-state="ready" />;
}
