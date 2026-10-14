"use client";

import { motion } from "framer-motion";
import type { MessageKey } from "@/i18n/messages/en";

/** The same server-renderable introduction for the store and its loading shell. */
export default function StoreHero({
  t,
  shouldReduceMotion = false,
}: {
  t: (key: MessageKey) => string;
  shouldReduceMotion?: boolean | null;
}) {
  return (
    <div>
      <motion.h1
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : undefined}
        className="max-w-3xl font-brand text-paw-type-h1 font-black text-paw-ink sm:text-paw-type-display"
      >
        {t("storeHeroTitlePrefix")}{" "}
        <span className="text-paw-on-primary-soft">{t("storeHeroTitleHighlight")}</span>
      </motion.h1>
      <motion.p
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.08 }}
        className="mt-paw-sm max-w-2xl text-paw-type-body text-paw-body sm:text-paw-type-body"
      >
        {t("storeHeroCopy")}
      </motion.p>
    </div>
  );
}
