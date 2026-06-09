"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
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

function PanelBox({
  title,
  children,
  onBack,
}: {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <section className="rounded-2xl border-2 border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="touch-target inline-flex items-center justify-center rounded-xl border-2 border-border bg-background px-3 text-sm font-bold text-foreground active:opacity-90"
        >
          <ChevronLeft className="size-5" aria-hidden />
          Back
        </button>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
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

  function handleSubmit() {
    const entry = {
      type,
      message: message.trim(),
      email: email.trim(),
      at: new Date().toISOString(),
    };
    const key = "campready:submissions";
    let existing: unknown[] = [];
    try {
      existing = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
      if (!Array.isArray(existing)) {
        existing = [];
      }
    } catch {
      existing = [];
    }
    localStorage.setItem(key, JSON.stringify([entry, ...existing]));
    setSubmitted(true);
    setMessage("");
    setEmail("");
  }

  if (submitted) {
    return (
      <PanelBox title={type === "feedback" ? "Feedback" : "Report Bug"} onBack={onBack}>
        <p className="text-base leading-relaxed text-foreground">
          Thank you. Your message was saved on this device.
        </p>
      </PanelBox>
    );
  }

  return (
    <PanelBox title={type === "feedback" ? "Feedback" : "Report Bug"} onBack={onBack}>
      <p className="text-base leading-relaxed text-muted">{prompt}</p>
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          Message
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-base text-foreground"
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
          className="touch-target rounded-xl border-2 border-border bg-background px-3 text-base text-foreground"
          placeholder="you@example.com"
        />
      </label>
      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!message.trim()}
          className="touch-target rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground active:opacity-90 disabled:opacity-50"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={onBack}
          className="touch-target rounded-xl border-2 border-border bg-background px-4 text-base font-bold text-foreground active:opacity-90"
        >
          Back
        </button>
      </div>
    </PanelBox>
  );
}

export function InfoPanel() {
  const { infoView, setInfoView } = useCampReady();

  if (!infoView) return null;

  const goMenu = () => setInfoView("menu");

  if (infoView === "menu") {
    const buttons: { id: InfoView; label: string }[] = [
      { id: "about", label: "About" },
      { id: "guide", label: "User Guide" },
      { id: "feedback", label: "Feedback" },
      { id: "bug", label: "Report Bug" },
    ];

    return (
      <div className="flex flex-col gap-3 py-4">
        <h2 className="text-xl font-bold text-foreground">Information</h2>
        <ul className="flex flex-col gap-3">
          {buttons.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setInfoView(b.id)}
                className="touch-target flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-border bg-surface px-4 text-base font-bold text-foreground active:bg-background"
              >
                {b.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (infoView === "about") {
    return (
      <div className="py-4">
        <PanelBox title="About" onBack={goMenu}>
          <p className="text-base leading-relaxed text-foreground">{ABOUT_TEXT}</p>
        </PanelBox>
      </div>
    );
  }

  if (infoView === "guide") {
    return (
      <div className="py-4">
        <PanelBox title="User Guide" onBack={goMenu}>
          <ul className="flex flex-col gap-5">
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
        </PanelBox>
      </div>
    );
  }

  if (infoView === "feedback") {
    return (
      <div className="py-4">
        <FeedbackForm
          type="feedback"
          prompt="Let us know how this app can make your life easier."
          onBack={goMenu}
        />
      </div>
    );
  }

  return (
    <div className="py-4">
      <FeedbackForm
        type="bug"
        prompt="Tell us what’s broken."
        onBack={goMenu}
      />
    </div>
  );
}
