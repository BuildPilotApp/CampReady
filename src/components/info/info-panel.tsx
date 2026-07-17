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
import {
  FREE_TEMPLATE_LIMIT,
  FREE_TRIP_LIMIT,
  isPrimeTestLabBypassActive,
} from "@/lib/pro";
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
import { CampSyncMark } from "@/components/ui/camp-sync-mark";
import type { InfoView } from "@/types";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  CloudSun,
  Download,
  FileText,
  Gauge,
  Info,
  Layers,
  ListFilter,
  Lock,
  MapPin,
  Moon,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Scale,
  Settings,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useId, useState } from "react";

const ABOUT_TEXT =
  "CampSync is a trip planner and gear checklist for camping and road trips. Create trips, build reusable gear inventories, pack item-by-item from Needed to Staged to Packed, plan meals by day, and monitor vehicle payload. Add trip dates and a location for Dashboard weather. Designed for one-handed field use, with a split dashboard and checklist layout on larger screens.";

const INFORMATION_OVERLAY_CLASS_NAME = "information-menu-overlay";
const INFORMATION_SUBMENU_OVERLAY_CLASS_NAME =
  "information-menu-overlay information-submenu-overlay";
const INFORMATION_PANEL_CLASS_NAME = "information-menu-panel";

type GuideIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

interface UserGuideItem {
  icon: GuideIcon;
  text: string;
  pro?: boolean;
}

interface UserGuideSection {
  title: string;
  description?: string;
  items: UserGuideItem[];
}

const USER_GUIDE_QUICK_START: UserGuideItem[] = [
  {
    icon: CampSyncMark,
    text: "Dashboard: tap Create new trip, or Start with quick getaway trip.",
  },
  {
    icon: ClipboardList,
    text: "Gear Checklist: tap Add gear or Add category or tote to build the list.",
  },
  {
    icon: PackageCheck,
    text: "Packing: tap an item to move Needed -> Staged -> Packed.",
  },
  {
    icon: UtensilsCrossed,
    text: "Meal Prep (Pro): enable in Settings, then plan food by trip day.",
  },
  {
    icon: Download,
    text: "Export List: copy text or download a spreadsheet (.xlsx) with a Type dropdown (Gear or Meal).",
  },
];

const USER_GUIDE: UserGuideSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        icon: Plus,
        text: "Create new trip: add a name, dates, location, and optional saved checklist.",
      },
      {
        icon: CampSyncMark,
        text: "Start with quick getaway trip: load a sample trip and checklist.",
      },
      {
        icon: CheckCircle2,
        text: "Trip cards: tap a trip to select it and see packed progress.",
      },
      {
        icon: CalendarDays,
        text: "Edit trip details: rename the trip, change dates, update location, or load a checklist.",
      },
      {
        icon: CloudSun,
        text: "Weather card: add a location to show daily trip weather.",
      },
      {
        icon: Gauge,
        text: "Payload Summary: when enabled in Settings (Pro), shows packed gear weight vs your vehicle capacity.",
        pro: true,
      },
    ],
  },
  {
    title: "Gear Checklist",
    items: [
      {
        icon: Plus,
        text: "Add gear: add an item, weight, storage spot, and category without leaving the checklist.",
      },
      {
        icon: Layers,
        text: "Add category or tote: create groups like Kitchen, Shelter, Clothing, or Tools.",
      },
      {
        icon: PackageCheck,
        text: "Item status: tap once for Staged, tap again for Packed.",
      },
      {
        icon: ListFilter,
        text: "All / To pack: switch between the full checklist and remaining items.",
      },
      {
        icon: RotateCcw,
        text: "Reset All: tap, then confirm, to set every item back to Needed.",
      },
      {
        icon: FileText,
        text: "Export List: copy as text or download a spreadsheet (.xlsx) for the selected trip.",
      },
    ],
  },
  {
    title: "Meal Prep",
    items: [
      {
        icon: Settings,
        text: "Enable Meal Prep in Settings to show the Meals tab and desktop trip tools.",
        pro: true,
      },
      {
        icon: UtensilsCrossed,
        text: "Day cards: plan food for each trip day from start date through end date.",
        pro: true,
      },
      {
        icon: CheckCircle2,
        text: "Status: tap to mark Available or Consumed; recipe notes stay with each food item.",
        pro: true,
      },
      {
        icon: FileText,
        text: "Recipe notes: paste steps or links; URLs open as tappable links when viewed.",
        pro: true,
      },
    ],
  },
  {
    title: "Gear Inventory",
    items: [
      {
        icon: Layers,
        text: "Gear inventory: expand it to manage reusable saved checklists.",
      },
      {
        icon: Save,
        text: "Save trip list: turn the selected trip's gear into a reusable checklist.",
      },
      {
        icon: Download,
        text: "Load: apply a saved checklist to one trip or choose the trip when asked.",
      },
      {
        icon: Plus,
        text: "New checklist: create a reusable list from scratch.",
      },
      {
        icon: FileText,
        text: "Download Template: when no trip is selected, download a blank spreadsheet (.xlsx) template.",
      },
      {
        icon: ClipboardList,
        text: "Spreadsheet rows: Type dropdown is Gear or Meal. Gear needs Category and Item; Meal needs Day and Item. Status, Weight, Storage, and Recipe Notes are optional. Legacy CSV/JSON imports still work.",
      },
    ],
  },
  {
    title: "Weather",
    items: [
      {
        icon: MapPin,
        text: "Add a location from the weather card or Edit trip details.",
      },
      {
        icon: CloudSun,
        text: "Weather shows daily high / low temperature and wind.",
      },
      {
        icon: Download,
        text: "Offline: recently loaded weather may show as Cached.",
      },
    ],
  },
  {
    title: "CampSync Pro",
    items: [
      {
        icon: CampSyncMark,
        text: "Unlimited trips: plan more than one trip at a time.",
        pro: true,
      },
      {
        icon: Layers,
        text: "Unlimited saved checklists: keep lists for different rigs, seasons, or families.",
        pro: true,
      },
      {
        icon: Upload,
        text: "Import List: merge a spreadsheet (.xlsx) or legacy CSV/JSON into the selected trip (gear and Type=Meal rows) without duplicating matches.",
        pro: true,
      },
      {
        icon: Gauge,
        text: "Vehicle payload monitoring: track packed weight against capacity on the Dashboard.",
        pro: true,
      },
      {
        icon: UtensilsCrossed,
        text: "Meal Prep: plan food by trip day with Available/Consumed tracking and recipe notes.",
        pro: true,
      },
      {
        icon: Lock,
        text: "Upgrade: tap a Pro button and finish the one-time Google Play purchase.",
        pro: true,
      },
      {
        icon: RefreshCw,
        text: "Restore: open Information and tap Restore Pro purchase.",
        pro: true,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        icon: Settings,
        text: "Settings: open from the top bar.",
      },
      {
        icon: Moon,
        text: "Theme: choose Dark or Light for this device.",
      },
      {
        icon: Scale,
        text: "Units: choose pounds or kilograms for gear weights.",
      },
      {
        icon: Gauge,
        text: "Vehicle Payload: enable the alarm and set max capacity (Pro).",
        pro: true,
      },
      {
        icon: UtensilsCrossed,
        text: "Meal Prep: enable to show Meal Prep in navigation (Pro).",
        pro: true,
      },
      {
        icon: Download,
        text: "Download Backup: save all trips, dates, locations, pack status, meals, and inventories.",
      },
      {
        icon: Upload,
        text: "Restore Backup: replace this device's data with a CampSync backup file.",
      },
      {
        icon: Info,
        text: "About CampSync: check version, build type, and developer details.",
      },
    ],
  },
];

function ProBadge() {
  return (
    <span className="mr-1.5 inline-flex shrink-0 items-center rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-teal-700 dark:text-teal-300">
      CampSync Pro
    </span>
  );
}

function GuideBullet({ item }: { item: UserGuideItem }) {
  const Icon = item.icon;

  return (
    <li className="flex gap-2 text-sm leading-relaxed text-muted">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.25} aria-hidden />
      <span>
        {item.pro ? <ProBadge /> : null}
        {item.text}
      </span>
    </li>
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
  centerVertically = false,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  centerVertically?: boolean;
}) {
  return (
    <OverlayModal
      title={title}
      onClose={onClose}
      containerClassName={
        centerVertically
          ? INFORMATION_SUBMENU_OVERLAY_CLASS_NAME
          : INFORMATION_OVERLAY_CLASS_NAME
      }
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
      "Lifetime Pro is available in the CampSync Android app through Google Play.",
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
              <CampSyncMark className="size-5" aria-hidden />
              Upgrade to CampSync Pro
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
              className="touch-target flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:bg-surface"
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
      <InformationModal onClose={closeInfo} centerVertically>
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
        <section className="mt-5 rounded-xl border border-border bg-background/60 px-4 py-3">
          <h3 className="text-sm font-bold text-foreground">Free vs Pro</h3>
          <div className="mt-3 grid gap-3 text-sm leading-relaxed text-muted">
            <div>
              <p className="font-bold text-foreground">Free plan includes</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>The full packing workflow for one trip.</li>
                <li>One saved gear checklist for reuse.</li>
                <li>Weather, export, backup, restore, and offline device storage.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-foreground">CampSync Pro includes</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Unlimited trips instead of {FREE_TRIP_LIMIT}.</li>
                <li>Unlimited saved checklists instead of {FREE_TEMPLATE_LIMIT}.</li>
                <li>Import List for merging spreadsheet (.xlsx) or legacy CSV/JSON into a selected trip.</li>
                <li>A one-time Google Play purchase with no subscription.</li>
              </ul>
            </div>
          </div>
        </section>
      </InformationModal>
    );
  }

  if (infoView === "guide") {
    return (
      <InformationModal onClose={closeInfo} centerVertically>
        <PanelHeader title="User Guide" onBack={goMenu} />
        <div className="mt-4 rounded-xl border border-border bg-background/60 px-4 py-3">
          <p className="text-sm font-bold text-foreground">Quick start</p>
          <ul className="mt-2 space-y-2">
            {USER_GUIDE_QUICK_START.map((step) => (
              <GuideBullet key={step.text} item={step} />
            ))}
          </ul>
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
              <ul className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <GuideBullet key={item.text} item={item} />
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
      <InformationModal onClose={closeInfo} centerVertically>
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
      <InformationModal onClose={closeInfo} centerVertically>
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
      <InformationModal onClose={closeInfo} centerVertically>
        <FeedbackForm
          type="feedback"
          prompt="Let us know how this app can make your life easier."
          onBack={goMenu}
        />
      </InformationModal>
    );
  }

  return (
    <InformationModal onClose={closeInfo} centerVertically>
      <FeedbackForm type="bug" prompt="Tell us what's broken." onBack={goMenu} />
    </InformationModal>
  );
}
