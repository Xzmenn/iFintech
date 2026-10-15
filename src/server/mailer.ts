import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

type ResetEmail = { to: string; url: string };

export async function sendPasswordResetEmail({ to, url }: ResetEmail) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (process.env.NODE_ENV !== "production") {
      logger.info("Tautan reset kata sandi dibuat", { to, url });
    } else {
      logger.warn("SMTP belum dikonfigurasi; email reset kata sandi tidak dikirim");
    }
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "iFintech <noreply@ifintech.app>",
    to,
    subject: "Atur ulang kata sandi iFintech",
    text: `Gunakan tautan berikut untuk mengatur ulang kata sandi Anda. Tautan berlaku selama satu jam: ${url}`,
    html: `<p>Gunakan tautan berikut untuk mengatur ulang kata sandi Anda. Tautan berlaku selama satu jam:</p><p><a href="${url}">Atur ulang kata sandi</a></p>`,
  });
}
