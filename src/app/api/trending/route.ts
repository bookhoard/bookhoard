import { NextResponse } from "next/server";
import { fetchTrendingBooks, type TrendingPeriod } from "@/lib/trending";

const VALID_PERIODS = new Set<TrendingPeriod>(["daily", "weekly", "monthly"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("period") ?? "weekly";
  const period = (VALID_PERIODS.has(requested as TrendingPeriod) ? requested : "weekly") as TrendingPeriod;

  const books = await fetchTrendingBooks(period, 24);
  return NextResponse.json({ books });
}
