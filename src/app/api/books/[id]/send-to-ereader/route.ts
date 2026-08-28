import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getStorage } from "@/lib/storage";
import { readJson } from "@/lib/store";
import { getActiveProfile } from "@/lib/profiles/store";
import { getSettings } from "@/lib/settings/store";
import type { BookRecord } from "@/lib/books/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const book = await readJson<BookRecord>(`books/${id}/metadata.json`);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const [settings, profile] = await Promise.all([getSettings(), getActiveProfile()]);

  if (!settings.smtp.host || !settings.smtp.fromAddress) {
    return NextResponse.json(
      { error: "SMTP isn't configured yet — set it up in Settings → E-Reader Email." },
      { status: 400 }
    );
  }
  if (!profile.ereaderEmail) {
    return NextResponse.json(
      { error: "No e-reader email set for this profile — add one in Settings → Profile." },
      { status: 400 }
    );
  }

  const storage = getStorage();
  const stream = await storage.get(`books/${id}/book.epub`);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const buffer = Buffer.concat(chunks);

  const encryption = settings.smtp.encryption ?? "none";
  const transport = nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port ?? 587,
    secure: encryption === "ssl",
    requireTLS: encryption === "starttls",
    auth: settings.smtp.user ? { user: settings.smtp.user, pass: settings.smtp.pass } : undefined,
  });

  try {
    await transport.sendMail({
      from: settings.smtp.fromAddress,
      to: profile.ereaderEmail,
      subject: book.title,
      text: `Sent from Bookhoard: ${book.title} by ${book.author}`,
      attachments: [{ filename: `${book.title}.epub`, content: buffer }],
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to send email" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sentTo: profile.ereaderEmail });
}
