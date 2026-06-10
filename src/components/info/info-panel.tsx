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
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from "@/lib/legal-copy";
import type { InfoView } from "@/types";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

const ABOUT_TEXT =
  "CampReady is a simple gear checklist for camping and road trips. Build a reusable inventory of the gear you own, load it onto trips, and pack item-by-item with one-tap staging and checkoff. Add trip dates and a location to see weather on the Dashboard. CampReady is designed to be easy to scan with one hand—so you can focus on getting out the door without wondering what you left behind.";

const USER_GUIDE = [
  {
    title: "Getting started",
    items: [
      "Open the Dashboard to create trips, track packing progress, and view weather.",
      "The app starts with no trips—tap Create new trip to add your first one.",
      "When creating or editing a trip, open Gear checklist to choose New or a saved checklist from your inventory.",
      "Select a trip on the Dashboard, then switch to the Gear Checklist tab to pack.",
    ],
  },
  {
    title: "Saved gear checklists (your inventory)",
    items: [
      "Saved checklists are reusable lists of the gear you own, organized by category.",
      "On the Gear Checklist tab, expand Gear inventory to manage saved lists and build new ones. It stays collapsed by default so packing stays front and center.",
      "Each gear item has optional weight (lbs) and storage fields—for example tote, bin, or shelf.",
      "When you edit or create a checklist and trips exist, CampReady asks whether to load it onto a trip or edit inventory only—you pick which trip to replace.",
      "Saved checklists also appear when creating or editing a trip on the Dashboard.",
      "You can copy a trip's packed list into inventory with Save trip list to inventory inside Gear inventory.",
    ],
  },
  {
    title: "Packing a trip",
    items: [
      "With a trip selected, the Pack for section lists that trip's gear checklist.",
      "Add categories or totes to group gear—for example Kitchen, Shelter, or Tools.",
      "Category headers use a soft color tint—red for Needed, yellow for Staged, green when fully Packed—so you can spot what still needs attention.",
      "Each item shows a Needed, Staged, or Packed badge that matches its status color. Tap an item to advance: Needed → Staged → Packed.",
      "Use Edit at the top of a category to rename the category, add or remove items, or adjust weight and storage details.",
      "Use All or To pack to filter the list. Reset All (floating button) sets every item back to Needed.",
    ],
  },
  {
    title: "Trip details & weather",
    items: [
      "Expand Edit trip details on a trip card to change dates, location, or load a different saved checklist.",
      "Add a location using suggestions or press Enter to match coordinates.",
      "Weather shows daily high/low temps and wind for each trip day.",
      "Within 10 days: Live Forecast. Beyond that: Historical Average.",
    ],
  },
  {
    title: "Tips",
    items: [
      "Choose New when creating a trip if you want to build a fresh checklist as you pack.",
      "Save a checklist once you have your gear inventory set up—reuse it on every trip.",
      "Data saves automatically on this device. No account required.",
    ],
  },
];

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
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          Message
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className={modalTextareaClassName}
        />
      </label>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          Email (optional)
        </span>
        <input
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

  if (!infoView) return null;

  const goMenu = () => setInfoView("menu");

  if (infoView === "menu") {
    const buttons: { id: InfoView; label: string }[] = [
      { id: "about", label: "About" },
      { id: "guide", label: "User Guide" },
      { id: "terms", label: "Terms of Service & Disclaimers" },
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
      </OverlayModal>
    );
  }

  if (infoView === "about") {
    return (
      <OverlayModal onClose={closeInfo}>
        <PanelHeader title="About" onBack={goMenu} />
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
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {section.items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-muted">
                    {item}
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
