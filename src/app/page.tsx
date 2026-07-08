import type { Metadata } from "next";
import { ColorShift } from "@/components/color-shift";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/color-shift";

type SearchParams = { [key: string]: string | string[] | undefined };

// Build a dynamic OG/Twitter image from the shared URL's params, so a link
// previews as that exact color + photo + text combo (see app/og/route.tsx).
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const one = (key: string) =>
    typeof sp[key] === "string" ? (sp[key] as string) : undefined;

  const params = new URLSearchParams();
  for (const key of ["bg", "fg", "text", "photo"]) {
    const value = one(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  const ogUrl = `${BASE_PATH}/og${query ? `?${query}` : ""}`;

  return {
    openGraph: {
      title: "Color Shift",
      description:
        "Two colors. Background and foreground. See the contrast. Feel the combination.",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Color Shift",
      description:
        "Two colors. Background and foreground. See the contrast. Feel the combination.",
      images: [ogUrl],
    },
  };
}

export default function Home() {
  return <ColorShift />;
}
