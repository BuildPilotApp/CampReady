"use client";

import { OverlayModal } from "@/components/ui/overlay-modal";
import {
  modalInputClassName,
  modalTextareaClassName,
} from "@/components/ui/modal-field-styles";
import {
  FEEDBACK_SUCCESS_SAVED,
  FEEDBACK_SUCCESS_SENT,
  submitFeedback,
} from "@/lib/feedback-submission";
import { useCampReady } from "@/components/providers/camp-ready-provider";
import { usePro } from "@/components/providers/pro-provider";
import { useAppToast } from "@/components/ui/app-toast-provider";
import {
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
  TERMS_LAST_UPDATED,
  TERMS_SECTIONS,
} from "@/lib/legal-copy";
import { attemptRestoreProPurchase } from "@/lib/pro";
import type { InfoView } from "@/types";
import { ChevronLeft } from "lucide-react";
import { useId, useState } from "react";

const ABOUT_TEXT =
  "CampReady is a gear checklist for camping and road trips. Build a reusable inventory, load it onto trips, and pack item-by-item with one-tap staging and checkoff. Add trip dates and a location to see weather on the Dashboard. Designed for one-handed use in the field.";

interface UserGuideItem {
  text: string;
  lifetimePro?: boolean;
}

interface UserGuideSection {
  title: string;
  description?: string;
  items: UserGuideItem[];
}

const LIFETIME_PRO_LABEL = "CampReady Lifetime Pro";

const USER_GUIDE: UserGuideSection[] = [
  {
    title: "Getting started",
    items: [
      {
        text: "Open the Dashboard to create trips, track packing progress, and view weather.",
      },
      {
        text: "The app starts with no trips. Tap Create new trip to add your first one.",
      },
      {
        text: "When creating or editing a trip, open Gear checklist to choose New or a saved checklist from your inventory.",
      },
      {
        text: "Select a trip on the Dashboard, then switch to the Gear Checklist tab to pack.",
      },
    ],
  },
  {
    title: "Saved gear checklists (your inventory)",
    items: [
      {
        text: "Saved checklists are reusable lists of the gear you own, organized by category.",
      },
      {
        text: "On the Gear Checklist tab, expand Gear inventory to manage saved lists and build new ones. It stays collapsed by default so packing stays front and center.",
      },
      {
        text: "Each gear item has optional weight (lbs) and storage fields, such as tote, bin, or shelf.",
      },
      {
        text: "Tap Load on a saved checklist to apply it to a trip, or Edit to change categories and items.",
      },
      {
        text: "Use Save trip list at the top of Gear inventory to copy the current trip's gear into a reusable checklist.",
      },
    ],
  },
  {
    title: "Packing a trip",
    items: [
      {
        text: "With a trip selected, the Pack for section lists that trip's gear checklist.",
      },
      {
        text: "Add categories or totes to group gear, such as Kitchen, Shelter, or Tools.",
      },
      {
        text: "Category headers use a soft color tint: red for Needed, yellow for Staged, and green when fully Packed, so you can spot what still needs attention.",
      },
      {
        text: "Each item shows a Needed, Staged, or Packed badge that matches its status color. Tap an item to advance: Needed → Staged → Packed.",
      },
      {
        text: "Use Edit at the top of a category to rename the category, add or remove items, or adjust weight and storage details.",
      },
      {
        text: "Use All or To pack to filter the list. Reset All (floating button) sets every item back to Needed.",
      },
      {
        text: "Export List: in the pack list toolbar, tap Export List to copy your checklist as text, download a CSV spreadsheet, or choose Download App Backup to save a .json file you can re-import later with Lifetime Pro. Available when the trip has at least one item.",
      },
    ],
  },
  {
    title: "Trip details & weather",
    items: [
      {
        text: "Tap Add a location on the weather card, or expand Edit trip details, to set a location for forecasts.",
      },
      {
        text: "Weather shows daily high/low temps and wind for each trip day.",
      },
      {
        text: "Within 10 days: Live Forecast. Beyond that: Historical Average.",
      },
    ],
  },
  {
    title: LIFETIME_PRO_LABEL,
    description:
      "CampReady is free to use with one trip and one saved gear checklist. Lifetime Pro is a one-time upgrade that unlocks the features below. You can read these instructions anytime, even before upgrading, to see how Pro works and what you gain.",
    items: [
      {
        text: "Unlimited trips: create and manage as many concurrent trips as you need instead of being limited to one.",
        lifetimePro: true,
      },
      {
        text: "Unlimited saved gear checklists: build separate inventories for different rigs, seasons, or family setups instead of being limited to one.",
        lifetimePro: true,
      },
      {
        text: "Import List: merge a previously exported pack list back into a trip. On the Gear Checklist tab, tap Import List in the pack list toolbar (next to Export List). Select an app backup (.json) or CSV file from Export List. Categories and items that already exist are combined by name. Nothing is duplicated, and your current pack status on matching items is kept. Weight and storage details update when the import file includes them.",
        lifetimePro: true,
      },
      {
        text: "To upgrade, tap any Pro-only button (such as Import List, or Create new trip when you already have one trip) and follow the Lifetime Pro checkout. Pro unlocks on this device after purchase. No subscription is required.",
        lifetimePro: true,
      },
    ],
  },
  {
    title: "Tips",
    items: [
      {
        text: "Choose New when creating a trip if you want to build a fresh checklist as you pack.",
      },
      {
        text: "Save a checklist once you have your gear inventory set up, then reuse it on every trip.",
      },
      {
        text: "Data saves automatically on this device. No account required.",
      },
      {
        text: "Export a Download App Backup or CSV before a big pack. With Lifetime Pro, import that file later to merge gear back in without starting over.",
      },
    ],
  },
];

function LifetimeProBadge() {
  return (
    <span className="mr-1.5 inline-flex shrink-0 items-center rounded-md bg-teal-500/15 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
      Lifetime Pro
    </span>
  );
}

function PanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="touch-target inline-flex items-center justify-center rounded-xl border-2 border-border bg-background px-3 text-sm font-bold text-foreground active:opacity-90"
        >
          <ChevronLeft className="size-5" aria-hidden />
          Back
        </button>
      ) : null}
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function FeedbackForm({
  type,
  prompt,
  onBack,
}: {
  type: "feedback" | "bug";
  prompt: string;
  onBack: () => void;
}) {
  const messageId = useId();
  const emailId = useId();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const outcome = await submitFeedback({
        type,
        message: trimmedMessage,
        email: email.trim(),
      });
      setSuccessMessage(
        outcome === "sent" ? FEEDBACK_SUCCESS_SENT : FEEDBACK_SUCCESS_SAVED,
      );
      setSubmitted(true);
      setMessage("");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <PanelHeader
          title={type === "feedback" ? "Feedback" : "Report Bug"}
          onBack={onBack}
        />
        <p className="mt-4 text-base leading-relaxed text-foreground">
          {successMessage}
        </p>
      </>
    );
  }

  return (
    <>
      <PanelHeader
        title={type === "feedback" ? "Feedback" : "Report Bug"}
        onBack={onBack}
      />
      <p className="mt-4 text-base leading-relaxed text-muted">{prompt}</p>
      <label htmlFor={messageId} className="mt-4 flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          Message
        </span>
        <textarea
          id={messageId}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className={modalTextareaClassName}
        />
      </label>
      <label htmlFor={emailId} className="mt-3 flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          Email (optional)
        </span>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={modalInputClassName}
          placeholder="you@example.com"
        />
      </label>
      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!message.trim() || submitting}
          className="touch-target rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="touch-target rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:opacity-90"
        >
          Back
        </button>
      </div>
    </>
  );
}

export function InfoPanel() {
  const { infoView, setInfoView, closeInfo } = useCampReady();
  const { isPro } = usePro();
  const { showToast } = useAppToast();

  if (!infoView) return null;

  const goMenu = () => setInfoView("menu");

  const handleRestorePro = () => {
    const result = attemptRestoreProPurchase();
    if (result === "activated") {
      showToast("Lifetime Pro unlocked on this device.");
      return;
    }
    if (result === "already_pro") {
      showToast("Lifetime Pro is already active on this device.");
      return;
    }
    showToast(
      "No purchase found. Complete checkout in your browser, then return here or use the link in your Stripe receipt.",
    );
  };

  if (infoView === "menu") {
    const buttons: { id: InfoView; label: string }[] = [
      { id: "about", label: "About" },
      { id: "guide", label: "User Guide" },
      { id: "terms", label: "Terms of Service & Disclaimers" },
      { id: "privacy", label: "Privacy Policy" },
      { id: "feedback", label: "Feedback" },
      { id: "bug", label: "Report Bug" },
    ];

    return (
      <OverlayModal title="Information" onClose={closeInfo}>
        <ul className="mt-4 flex flex-col gap-3">
          {buttons.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setInfoView(b.id)}
                className="touch-target flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:bg-surface"
              >
                {b.label}
              </button>
            </li>
          ))}
        </ul>
        {!isPro ? (
          <button
            type="button"
            onClick={handleRestorePro}
            className="touch-target mt-4 w-full py-2 text-center text-sm font-medium text-muted active:text-foreground"
          >
            Restore Pro purchase
          </button>
        ) : null}
      </OverlayModal>
    );
  }

  if (infoView === "about") {
    return (
      <OverlayModal onClose={closeInfo}>
        <PanelHeader title="About" onBack={goMenu} />
        <p className="mt-3 text-sm text-muted">
          Plan:{" "}
          <span className="font-semibold text-foreground">
            {isPro ? "Lifetime Pro" : "Free"}
          </span>
        </p>
        <p className="mt-4 text-base leading-relaxed text-foreground">{ABOUT_TEXT}</p>
      </OverlayModal>
    );
  }

  if (infoView === "guide") {
    return (
      <OverlayModal onClose={closeInfo}>
        <PanelHeader title="User Guide" onBack={goMenu} />
        <ul className="mt-4 flex flex-col gap-5">
          {USER_GUIDE.map((section) => (
            <li key={section.title}>
              <p className="text-base font-bold text-foreground">{section.title}</p>
              {section.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {section.description}
                </p>
              ) : null}
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {section.items.map((item) => (
                  <li
                    key={item.text}
                    className="text-sm leading-relaxed text-muted"
                  >
                    {item.lifetimePro ? <LifetimeProBadge /> : null}
                    {item.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </OverlayModal>
    );
  }

  if (infoView === "terms") {
    return (
      <OverlayModal onClose={closeInfo}>
        <PanelHeader title="Terms of Service & Disclaimers" onBack={goMenu} />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Last Updated: {TERMS_LAST_UPDATED}
        </p>
        <ul className="mt-5 flex flex-col gap-6">
          {TERMS_SECTIONS.map((section) => (
            <li
              key={section.title}
              className="rounded-xl border border-border bg-background/60 px-4 py-3"
            >
              <h3 className="text-sm font-bold leading-snug text-foreground">
                {section.title}
              </h3>
              {section.body.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-2 text-sm leading-relaxed text-muted"
                >
                  {paragraph}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </OverlayModal>
    );
  }

  if (infoView === "privacy") {
    return (
      <OverlayModal onClose={closeInfo}>
        <PanelHeader title="Privacy Policy" onBack={goMenu} />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Last Updated: {PRIVACY_LAST_UPDATED}
        </p>
        <ul className="mt-5 flex flex-col gap-6">
          {PRIVACY_SECTIONS.map((section) => (
            <li
              key={section.title}
              className="rounded-xl border border-border bg-background/60 px-4 py-3"
            >
              <h3 className="text-sm font-bold leading-snug text-foreground">
                {section.title}
              </h3>
              {section.body.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-2 text-sm leading-relaxed text-muted"
                >
                  {paragraph}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </OverlayModal>
    );
  }

  if (infoView === "feedback") {
    return (
      <OverlayModal onClose={closeInfo}>
        <FeedbackForm
          type="feedback"
          prompt="Let us know how this app can make your life easier."
          onBack={goMenu}
        />
      </OverlayModal>
    );
  }

  return (
    <OverlayModal onClose={closeInfo}>
      <FeedbackForm type="bug" prompt="Tell us what's broken." onBack={goMenu} />
    </OverlayModal>
  );
}
