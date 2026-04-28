import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-sunken">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {SITE.name} &middot; {SITE.tagline}
        </p>
        <div className="flex items-center gap-6">
          <Link href="/plants" className="hover:text-ink">
            Plants
          </Link>
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <Link href="/guide" className="hover:text-ink">
            Guide
          </Link>
          <a
            href={SITE.github.url}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-ink"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
