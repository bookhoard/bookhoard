import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

export async function GET() {
  try {
    await getStorage().list("");
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 503 }
    );
  }
}
