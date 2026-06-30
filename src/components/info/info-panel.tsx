"use client";

import { HostedLegalLink } from "@/components/info/hosted-legal-link";
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
import { isPrimeTestLabBypassActive } from "@/lib/pro";
import { canUseNativeGooglePlayBilling, restoreNativeCampReadyPro } from "@/lib/native-billing";
import {
  APP_VERSION,
  DEVELOPER_NAME,
  IS_PRIME_TEST_LAB_BUILD,
} from "@/lib/build-config";
import {
  HOSTED_PRIVACY_POLICY_URL,
  HOSTED_TERMS_OF_SERVICE_URL,
} from "@/lib/legal-urls";
import type { InfoView } from "@/types";
import { ChevronLeft, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";

const ABOUT_TEXT =
  "CampReady is a trip planner and gear checklist for camping and road trips. Create trips, build reusable gear inventories, load them onto pack lists, and move item-by-item from Needed to Staged to Packed. Add trip dates and a location to see weather on the Dashboard. Designed for one-handed use in the field, with a split dashboard and checklist layout on larger screens.";

const INFORMATION_OVERLAY_CLASS_NAME = "information-menu-overlay";
const INFORMATION_PANEL_CLASS_NAME = "information-menu-panel";

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

const USER_GUIDE_QUICK_START = [
  "Create a trip on the Dashboard, or tap Start with weekend example to explore the app.",
  "Open Gear Checklist, then use Add gear, Add category or tote, or Gear inventory to build the pack list.",
  "Tap each item once to stage it and again when it is packed in the vehicle.",
  "Use Export List for text, CSV, or app backups; Lifetime Pro also unlocks Import List.",
] as const;

const USER_GUIDE: UserGuideSection[] = [
  {
    title: "Getting started",
    items: [
      {
        text: "Open the Dashboard to create trips, select the trip you are packing, track progress, and view trip weather.",
      },
      {
        text: "The app starts with no trips. Tap Create new trip to add your first trip, or Start with weekend example to load a sample trip and checklist.",
      },
      {
        text: "Dates and location are optional, but adding them enables trip-day weather on the selected trip card.",
      },
      {
        text: "When creating or editing a trip, choose New to start fresh or select a saved checklist from Gear inventory.",
      },
      {
        text: "On phones, switch between Dashboard and Gear Checklist from the bottom navigation. On larger screens, both views appear side by side.",
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
        text: "On the Gear Checklist tab, expand Gear inventory to create, edit, load, or delete saved lists. It stays collapsed by default so packing stays front and center.",
      },
      {
        text: "Tap Load on a saved checklist to apply it to a trip. If you have multiple trips, CampReady asks which trip should receive the checklist.",
      },
      {
        text: "Use Save trip list at the top of Gear inventory to copy the selected trip's current gear into a reusable checklist.",
      },
      {
        text: "Each gear item can include optional weight in pounds and a storage location, such as tote, bin, shelf, or vehicle area.",
      },
      {
        text: "When no trip is selected, Export List changes to Download Template so you can download blank CSV or JSON files for building an inventory outside the app.",
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
        text: "Use Add gear to add items without leaving the checklist. You can choose an existing category or create a new category at the same time.",
      },
      {
        text: "Use Add category or tote to create groups such as Kitchen, Shelter, Clothing, or Tools before adding detailed items.",
      },
      {
        text: "Category headers use a soft color tint: red for Needed, yellow for Staged, and green when fully Packed, so you can spot what still needs attention.",
      },
      {
        text: "Each item shows a Needed, Staged, or Packed badge that matches its status color. Tap an item to advance: Needed -> Staged -> Packed.",
      },
      {
        text: "Use Edit at the top of a category to rename the category, add or remove items, or adjust weight and storage details.",
      },
      {
        text: "Use All or To pack to filter the list. Reset All sets every item back to Needed after confirmation.",
      },
      {
        text: "Export List: in the pack list toolbar, copy your checklist as text, download a CSV spreadsheet, or choose Download App Backup to save a .json file you can re-import later with Lifetime Pro. Available when the trip has at least one item.",
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
      {
        text: "Edit trip details also lets you rename the trip, change dates, update the location, or replace the trip's checklist with New or a saved inventory.",
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
        text: "Import List: merge a previously exported pack list back into the selected trip. On the Gear Checklist tab, tap Import List in the pack list toolbar next to Export List. Select an app backup (.json) or CSV file from Export List. Categories and items that already exist are combined by name, matching items keep their current pack status, and weight or storage details update when the file includes them.",
        lifetimePro: true,
      },
      {
        text: "To upgrade on Android, tap any Pro-only button (such as Import List, or Create new trip when you already have one trip) and complete checkout through Google Play. Pro unlocks on this device after purchase. No subscription is required.",
        lifetimePro: true,
      },
      {
        text: "If you already purchased Pro, open the Information menu and tap Restore Pro purchase to unlock Pro again on this device.",
        lifetimePro: true,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        text: "Tap Settings from the header or bottom navigation to switch between Dark and Light themes for this device.",
      },
      {
        text: "Settings also shows the app version, build type, and developer details.",
      },
      {
        text: "Theme is an app preference. It does not change trip, checklist, or Pro purchase data.",
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
        text: "Save a checklist once you have your gear inventory set up, then reuse it on future trips.",
      },
      {
        text: "Download a blank CSV or JSON template before building a large inventory outside the app, then import it later with Lifetime Pro.",
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

function InformationModal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <OverlayModal
      title={title}
      onClose={onClose}
      containerClassName={INFORMATION_OVERLAY_CLASS_NAME}
      panelClassName={INFORMATION_PANEL_CLASS_NAME}
    >
      {children}
    </OverlayModal>
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
  const { isPro, openPaywall, refreshProAccess } = usePro();
  const { showToast } = useAppToast();

  if (!infoView) return null;

  const goMenu = () => setInfoView("menu");

  const handleRestorePro = async () => {
    if (isPrimeTestLabBypassActive()) {
      showToast("All Pro features are unlocked during Play Store closed testing.");
      return;
    }

    if (canUseNativeGooglePlayBilling()) {
      const restored = await restoreNativeCampReadyPro();
      if (restored) {
        refreshProAccess();
        showToast("Lifetime Pro unlocked on this device.");
        return;
      }
      showToast(
        "No Google Play purchase found for this account on this device.",
      );
      return;
    }

    showToast(
      "Lifetime Pro is available in the CampReady Android app through Google Play.",
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

    const handleUpgrade = () => {
      closeInfo();
      openPaywall();
    };

    return (
      <InformationModal
        title="Information"
        onClose={closeInfo}
      >
        <div className="mt-5 flex flex-col gap-4">
          {!isPro ? (
            <button
              type="button"
              onClick={handleUpgrade}
              className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 px-4 py-3 text-base font-bold text-zinc-950 shadow-md shadow-amber-500/20 active:opacity-90"
            >
              <Sparkles className="size-5" aria-hidden />
              Upgrade to CampReady Pro
            </button>
          ) : null}
          <ul className="flex flex-col gap-3.5">
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
              className="touch-target w-full py-2 text-center text-sm font-medium text-muted active:text-foreground"
            >
              Restore Pro purchase
            </button>
          ) : null}
          <p className="rounded-lg border border-border/50 bg-surface/60 px-3 py-3 text-center text-xs leading-relaxed text-muted">
            <span className="font-medium text-foreground/75">Works offline</span>
            <span aria-hidden> · </span>
            <span className="font-medium text-foreground/75">No account needed</span>
            <span aria-hidden> · </span>
            <span className="font-medium text-foreground/75">Data stays on device</span>
          </p>
        </div>
      </InformationModal>
    );
  }

  if (infoView === "about") {
    return (
      <InformationModal onClose={closeInfo}>
        <PanelHeader title="About" onBack={goMenu} />
        <p className="mt-3 text-sm text-muted">
          Plan:{" "}
          <span className="font-semibold text-foreground">
            {isPro ? "Lifetime Pro" : "Free"}
          </span>
        </p>
        <p className="mt-2 text-xs text-muted">
          Version {APP_VERSION}
          {IS_PRIME_TEST_LAB_BUILD ? " · Play Store test build" : null}
        </p>
        <p className="mt-1 text-xs text-muted">
          {DEVELOPER_NAME}
        </p>
        <p className="mt-4 text-base leading-relaxed text-foreground">{ABOUT_TEXT}</p>
      </InformationModal>
    );
  }

  if (infoView === "guide") {
    return (
      <InformationModal onClose={closeInfo}>
        <PanelHeader title="User Guide" onBack={goMenu} />
        <div className="mt-4 rounded-xl border border-border bg-background/60 px-4 py-3">
          <p className="text-sm font-bold text-foreground">Quick start</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            {USER_GUIDE_QUICK_START.map((step) => (
              <li key={step} className="text-sm leading-relaxed text-muted">
                {step}
              </li>
            ))}
          </ol>
        </div>
        <ul className="mt-5 flex flex-col gap-5">
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
      </InformationModal>
    );
  }

  if (infoView === "terms") {
    return (
      <InformationModal onClose={closeInfo}>
        <PanelHeader title="Terms of Service & Disclaimers" onBack={goMenu} />
        <HostedLegalLink
          href={HOSTED_TERMS_OF_SERVICE_URL}
          label="View hosted Terms of Service"
        />
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
      </InformationModal>
    );
  }

  if (infoView === "privacy") {
    return (
      <InformationModal onClose={closeInfo}>
        <PanelHeader title="Privacy Policy" onBack={goMenu} />
        <HostedLegalLink
          href={HOSTED_PRIVACY_POLICY_URL}
          label="View hosted Privacy Policy"
        />
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
      </InformationModal>
    );
  }

  if (infoView === "feedback") {
    return (
      <InformationModal onClose={closeInfo}>
        <FeedbackForm
          type="feedback"
          prompt="Let us know how this app can make your life easier."
          onBack={goMenu}
        />
      </InformationModal>
    );
  }

  return (
    <InformationModal onClose={closeInfo}>
      <FeedbackForm type="bug" prompt="Tell us what's broken." onBack={goMenu} />
    </InformationModal>
  );
}
