"use client";

import { useCampReady } from "@/components/providers/camp-ready-provider";
import type { InfoView } from "@/types";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

const ABOUT_TEXT =
  "The sole purpose of CampReady is to provide a simple, interactive checklist for your camping gear and anything else you need to bring along. Create custom categories or use the ones already included in the app. Once a location is added, real-time weather will appear on the active trip card. Be sure to read through the User Guide to familiarize yourself with everything the app has to offer. Just remember, CampReady isn’t meant to be an overbloated, feature-packed widget on your phone. It’s designed to be a simple, easy-to-scan tool that helps prevent you from leaving things behind. From firewood to important medications, CampReady helps you check items off as you pack them into your rig, so you can enjoy your time off the grid without the constant “Did I forget something?” feeling.";

const USER_GUIDE = [
  {
    title: "Getting started",
    items: [
      "Open the Dashboard to view your trips, packing progress, and weather.",
      "Create a new trip with a name, dates, location, and checklist template.",
      "Tap a trip to select it and open its checklist.",
    ],
  },
  {
    title: "Custom checklists",
    items: [
      "On the Checklist tab, open Saved checklists to view, rename, edit, or delete your saved lists.",
      "Expand a checklist to edit categories and items, or delete the whole list.",
      "Save a trip checklist with Save custom checklist, then pick it when creating or editing a trip.",
    ],
  },
  {
    title: "Master checklist",
    items: [
      "Use the Checklist tab to pack item-by-item.",
      "Toggle All Items vs Remaining to Pack to focus on what’s left.",
      "Tap a row to cycle status: Missing → Staged → Packed in Vehicle.",
      "Expand categories to add, rename, or delete items and categories.",
    ],
  },
  {
    title: "Trip details & weather",
    items: [
      "Add a location using suggestions or press Enter to match coordinates.",
      "Weather shows daily high/low temps and wind for each trip day.",
      "Within 10 days: Live Forecast. Beyond that: Historical Average.",
    ],
  },
  {
    title: "Tips",
    items: [
      "Use weight fields to track total load in the checklist header.",
      "Storage location fields help you find gear before you pack.",
      "Reset All (checklist FAB) sets every item back to Missing.",
      "Data saves automatically on this device—no account required.",
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
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
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
