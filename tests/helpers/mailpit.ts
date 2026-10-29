import { setTimeout as delay } from "node:timers/promises";

import type { APIRequestContext } from "@playwright/test";

type MailpitAddress = {
  Address?: string;
  address?: string;
};

type MailpitMessageSummary = {
  ID?: string;
  id?: string;
  Subject?: string;
  subject?: string;
  To?: MailpitAddress[];
  to?: MailpitAddress[];
};

type MailpitMessagesResponse = {
  messages?: MailpitMessageSummary[];
  Messages?: MailpitMessageSummary[];
};

type MailpitMessageResponse = MailpitMessageSummary & {
  Text?: string;
  text?: string;
  HTML?: string;
  html?: string;
};

export type CapturedEmail = {
  id: string;
  subject: string;
  text: string;
  html: string;
};

function mailpitApiUrl(): string {
  return (process.env.MAILPIT_API_URL ?? "http://127.0.0.1:8025").replace(
    /\/+$/,
    "",
  );
}

function summaryId(message: MailpitMessageSummary): string | undefined {
  return message.ID ?? message.id;
}

function summarySubject(message: MailpitMessageSummary): string {
  return message.Subject ?? message.subject ?? "";
}

function recipientAddresses(message: MailpitMessageSummary): string[] {
  return (message.To ?? message.to ?? [])
    .map((recipient) => recipient.Address ?? recipient.address ?? "")
    .filter(Boolean);
}

export async function waitForCapturedEmail(
  request: APIRequestContext,
  options: {
    recipient: string;
    subject: string;
    timeoutMs?: number;
  },
): Promise<CapturedEmail> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const listResponse = await request.get(
      `${mailpitApiUrl()}/api/v1/messages`,
    );
    if (listResponse.ok()) {
      const payload = (await listResponse.json()) as MailpitMessagesResponse;
      const messages = payload.messages ?? payload.Messages ?? [];
      const matchingMessage = messages.find(
        (message) =>
          summarySubject(message) === options.subject &&
          recipientAddresses(message).includes(options.recipient),
      );
      const id = matchingMessage ? summaryId(matchingMessage) : undefined;

      if (id) {
        const messageResponse = await request.get(
          `${mailpitApiUrl()}/api/v1/message/${encodeURIComponent(id)}`,
        );
        if (messageResponse.ok()) {
          const message =
            (await messageResponse.json()) as MailpitMessageResponse;
          return {
            id,
            subject: summarySubject(message),
            text: message.Text ?? message.text ?? "",
            html: message.HTML ?? message.html ?? "",
          };
        }
      }
    }

    await delay(250);
  }

  throw new Error(
    `Mailpit did not receive the expected ${options.subject} message within ${timeoutMs}ms.`,
  );
}

export function extractPasswordResetUrl(message: CapturedEmail): string {
  const match = message.text.match(
    /https?:\/\/[^\s<>"']+\/password-reset\/confirm#[^\s<>"']+/,
  );
  if (!match) {
    throw new Error("The captured password-reset email has no reset URL.");
  }

  const resetUrl = new URL(match[0]);
  const fragment = new URLSearchParams(resetUrl.hash.replace(/^#/, ""));
  if (
    resetUrl.pathname !== "/password-reset/confirm" ||
    !fragment.get("uid") ||
    !fragment.get("token")
  ) {
    throw new Error(
      "The captured password-reset email has an invalid reset URL.",
    );
  }

  return resetUrl.toString();
}
