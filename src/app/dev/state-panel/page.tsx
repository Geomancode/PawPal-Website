import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button, StatePanel, StatusMessage } from "@/components/ui";
export const metadata: Metadata = {
  title: "State panel development harness",
  description: "Development-only visual harness for PawPal state panels.",
};

export default function StatePanelHarness() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <div data-harness-case="loading">
        <StatePanel
          state="loading"
          title="Loading your PawPal world"
          body="Fetching the latest pet activity and nearby places."
        />
      </div>

      <div data-harness-case="empty" hidden>
        <StatePanel
          state="empty"
          title="No adventures here yet"
          body="Start a walk or follow a nearby pet to fill this space."
          action={
            <Button type="button">Explore nearby pets</Button>
          }
        />
      </div>

      <div data-harness-case="error" hidden>
        <StatePanel
          state="error"
          title="Something interrupted the trail"
          body="We could not load this page. Your data is safe, so please try again."
          action={
            <Button type="button" variant="critical">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          }
        />
      </div>

      <div data-harness-case="profile-unavailable" data-capture-target="profile-unavailable" hidden>
        <StatePanel
          state="error"
          title="Profile unavailable"
          body="We could not load your profile. Please try again in a moment."
        />
      </div>

      <div data-harness-case="store-subscription-error" hidden>
        <section className="deep-page-shell min-h-[100dvh] bg-paw-page px-paw-md py-32 text-paw-ink sm:px-paw-xl lg:px-paw-xxl">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-brand text-paw-type-h1 font-black">Choose your PawPal plan</h1>
            <div className="mt-paw-lg" data-capture-target="store-subscription-error">
              <StatusMessage tone="critical" variant="compact">
                We could not start your subscription checkout. Please try again.
              </StatusMessage>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
