import type { Metadata } from "next";
import { LibraryPage } from "@/components/library/library-page";

// Overrides the root layout's plain "Bookhoarder" title on the homepage only
// — other routes (Trending, Settings, ...) keep inheriting it.
export const metadata: Metadata = {
  title: "Bookhoarder: A Self-Hosted EPUB Library",
};

export default function Page() {
  return <LibraryPage />;
}
