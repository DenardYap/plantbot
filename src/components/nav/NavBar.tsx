import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { GithubStars } from "./GithubStars";
import { SITE } from "@/lib/site";

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Translucent, blurred surface so content can scroll beneath */}
      <div className="w-full bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-center px-4">
          <nav
            aria-label="Primary"
            className="flex items-center gap-3 sm:gap-4"
          >
            {/* Wordmark — left of the pill so we have a visible site identity */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center rounded-full px-3 py-2 text-xl font-extrabold tracking-tight text-ink hover:text-brand"
              aria-label={`${SITE.name} home`}
            >
              {SITE.name}
            </Link>

            {/* Pill-shaped segmented nav */}
            <div
              role="group"
              aria-label="Sections"
              className="flex items-center gap-1 rounded-full border border-border bg-surface p-0.5 shadow-[0_1px_0_hsl(150_10%_90%),_0_8px_24px_-12px_hsl(150_20%_15%/0.15)]"
            >
              <NavLinks />
            </div>

            {/* GitHub badge */}
            <GithubStars />
          </nav>
        </div>
      </div>
    </header>
  );
}
