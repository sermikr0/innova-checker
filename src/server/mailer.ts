import nodemailer from "nodemailer";
import { env } from "./env";

// Outbound e-mail. Uses SMTP when configured; otherwise messages are written to the
// server log so password resets remain testable in development.

export async function sendMail(msg: { to: string; subject: string; text: string }): Promise<{ delivered: boolean }> {
  const e = env();
  if (!e.SMTP_HOST) {
    console.info(`[mail:not-configured] To: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}`);
    return { delivered: false };
  }
  const transport = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_PORT === 465,
    auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
  });
  await transport.sendMail({ from: e.SMTP_FROM ?? e.SMTP_USER, ...msg });
  return { delivered: true };
}
