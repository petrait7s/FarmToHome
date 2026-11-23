import "server-only";
import { env } from "@/lib/env";

export type MailMessage = { to: string; subject: string; text: string };

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** Development driver: writes messages to the server log. Replace with an email/SMS provider in production. */
class ConsoleMailer implements Mailer {
  async send(message: MailMessage) {
    console.info(`[mail:console] to=${message.to} subject="${message.subject}"\n${message.text}`);
  }
}

export function getMailer(): Mailer {
  switch (env.MAIL_DRIVER) {
    case "console":
    default:
      return new ConsoleMailer();
  }
}
