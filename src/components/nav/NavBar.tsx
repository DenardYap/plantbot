import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { GithubStars } from "./GithubStars";
import { SITE } from "@/lib/site";

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Translucent, blurred surface so content can scroll beneath */}
      <div className="w-full bg-background/75 backdrop-blur-md">
        {/*
         * 3-column grid: [1fr | auto | 1fr]
         * - Left and right columns share any leftover space equally, so the
         *   middle column (the nav pill) is mathematically centered on the
         *   viewport regardless of how wide it becomes.
         * - Wordmark sits at the left edge, GitHub at the right edge — both
         *   are anchored and never shift when the active tab changes.
         */}
        <div className="mx-auto grid h-20 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:gap-4">
          {/* Wordmark — anchored to the left edge */}
          <Link
            href="/"
            className="hidden justify-self-start rounded-full px-3 py-2 text-xl font-extrabold tracking-tight text-ink transition-colors hover:text-brand sm:inline-flex sm:items-center"
            aria-label={`${SITE.name} home`}
          >
            {SITE.name}
          </Link>
          {/* On mobile the wordmark is hidden; the empty column still holds
              the grid shape so the pill stays centered. */}
          <span aria-hidden className="sm:hidden" />

          {/* Pill-shaped segmented nav — centered in the viewport */}
          <nav
            aria-label="Primary"
            className="justify-self-center"
          >
            <div
              role="group"
              aria-label="Sections"
              className="flex items-center gap-1 rounded-full border border-border bg-surface p-0.5 shadow-[0_1px_0_hsl(150_10%_90%),_0_8px_24px_-12px_hsl(150_20%_15%/0.15)]"
            >
              <NavLinks />
            </div>
          </nav>

          {/* GitHub badge — anchored to the right edge */}
          <div className="justify-self-end">
            <GithubStars />
          </div>
        </div>
      </div>
    </header>
  );
}
