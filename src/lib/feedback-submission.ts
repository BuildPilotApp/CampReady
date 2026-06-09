const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvznqzpd";
const LOCAL_SUBMISSIONS_KEY = "campready:submissions";

export const FEEDBACK_SUCCESS_SENT =
  "Thank you! Your message was sent to our team for review.";
export const FEEDBACK_SUCCESS_SAVED =
  "Thank you. Your message was saved on this device.";

export interface FeedbackSubmission {
  type: "feedback" | "bug";
  message: string;
  email: string;
}

function saveSubmissionLocally(entry: FeedbackSubmission & { at: string }): void {
  let existing: unknown[] = [];
  try {
    existing = JSON.parse(
      localStorage.getItem(LOCAL_SUBMISSIONS_KEY) ?? "[]",
    ) as unknown[];
    if (!Array.isArray(existing)) {
      existing = [];
    }
  } catch {
    existing = [];
  }
  localStorage.setItem(
    LOCAL_SUBMISSIONS_KEY,
    JSON.stringify([entry, ...existing]),
  );
}

export async function submitFeedback(
  submission: FeedbackSubmission,
): Promise<"sent" | "saved"> {
  const entry = {
    ...submission,
    at: new Date().toISOString(),
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    saveSubmissionLocally(entry);
    return "saved";
  }

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: submission.type,
        message: submission.message,
        email: submission.email || undefined,
        _subject:
          submission.type === "feedback"
            ? "CampReady Feedback"
            : "CampReady Bug Report",
      }),
    });

    if (response.ok) {
      return "sent";
    }

    saveSubmissionLocally(entry);
    return "saved";
  } catch {
    saveSubmissionLocally(entry);
    return "saved";
  }
}
