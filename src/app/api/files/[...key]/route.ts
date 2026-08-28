import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { contentTypeFor } from "@/lib/content-type";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  const key = segments.join("/");
  const storage = getStorage();

  if (!(await storage.exists(key))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nodeStream = await storage.get(key);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: { "Content-Type": contentTypeFor(key) },
  });
}
