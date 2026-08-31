import { NextResponse } from "next/server";
import { getActiveProfile } from "@/lib/profiles/store";
import { createBackupStream } from "@/lib/backup/export";
import { DEMO_MODE } from "@/lib/demo-mode";

export async function GET(request: Request) {
  // GET isn't a "mutation", so middleware.ts's DEMO_MODE gate doesn't block
  // it automatically — a full-bucket export isn't something the public
  // read-only demo should expose either, so check explicitly here.
  if (DEMO_MODE) {
    return NextResponse.json(
      { error: "This is a read-only demo — backups are disabled." },
      { status: 403 }
    );
  }

  const active = await getActiveProfile();
  if (active.role !== "admin") {
    return NextResponse.json({ error: "Only an admin can download a backup" }, { status: 403 });
  }

  const includeFiles = new URL(request.url).searchParams.get("files") === "1";
  const stream = createBackupStream({ includeFiles });
  const date = new Date().toISOString().slice(0, 10);
  const filename = `bookhoard-backup-${date}${includeFiles ? "-full" : ""}.zip`;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
