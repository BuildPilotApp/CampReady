const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvznqzpd";
const LOCAL_SUBMISSIONS_KEY = "campready:submissions";

export const FEEDBACK_SUCCESS_SENT =
  "Thank you. Your message was sent to our team.";
export const FEEDBACK_SUCCESS_SAVED =
  "Thank you. Your message was saved on this device.";

export interface FeedbackSubmission {
  type: "feedback" | "bug";
  message: string;
  email: string;
}

interface QueuedFeedbackSubmission extends FeedbackSubmission {
  id: string;
  at: string;
}

export interface FeedbackFlushResult {
  sent: number;
  remaining: number;
}

function readQueuedSubmissions(): QueuedFeedbackSubmission[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is QueuedFeedbackSubmission => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }

      const record = entry as Partial<QueuedFeedbackSubmission>;
      return (
        typeof record.id === "string" &&
        typeof record.at === "string" &&
        (record.type === "feedback" || record.type === "bug") &&
        typeof record.message === "string" &&
        typeof record.email === "string"
      );
    });
  } catch {
    return [];
  }
}

function writeQueuedSubmissions(entries: QueuedFeedbackSubmission[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (entries.length === 0) {
      localStorage.removeItem(LOCAL_SUBMISSIONS_KEY);
      return;
    }

    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(entries));
  } catch {
    // Queue write is best-effort.
  }
}

function saveSubmissionLocally(entry: QueuedFeedbackSubmission): void {
  writeQueuedSubmissions([entry, ...readQueuedSubmissions()]);
}

async function postFeedbackToFormspree(
  submission: FeedbackSubmission,
): Promise<boolean> {
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
            ? "CampSync Feedback"
            : "CampSync Bug Report",
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/** Attempts to upload any locally queued feedback when connectivity returns. */
export async function flushPendingFeedbackSubmissions(): Promise<FeedbackFlushResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const remaining = readQueuedSubmissions().length;
    return { sent: 0, remaining };
  }

  const queue = readQueuedSubmissions();
  if (queue.length === 0) {
    return { sent: 0, remaining: 0 };
  }

  const stillPending: QueuedFeedbackSubmission[] = [];
  let sent = 0;

  for (const entry of queue) {
    const delivered = await postFeedbackToFormspree(entry);
    if (delivered) {
      sent += 1;
    } else {
      stillPending.push(entry);
    }
  }

  writeQueuedSubmissions(stillPending);
  return { sent, remaining: stillPending.length };
}

export async function submitFeedback(
  submission: FeedbackSubmission,
): Promise<"sent" | "saved"> {
  const entry: QueuedFeedbackSubmission = {
    ...submission,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    saveSubmissionLocally(entry);
    return "saved";
  }

  const delivered = await postFeedbackToFormspree(submission);
  if (delivered) {
    return "sent";
  }

  saveSubmissionLocally(entry);
  return "saved";
}
