import { SITE } from "@/lib/site";
import { StarIcon, GithubMarkIcon } from "@/components/icons";

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(k < 10 ? 1 : 0)}k`;
  }
  return String(n);
}

/**
 * Static star count — no live GitHub API calls by default.
 * To show a live count, set NEXT_PUBLIC_GITHUB_STARS at build time, or
 * (with approval) swap this for a server component that fetches
 * https://api.github.com/repos/<owner>/<repo>.
 */
export function GithubStars() {
  const { url: repoUrl, stars } = SITE.github;

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Star ${SITE.name} on GitHub (${stars} stars)`}
      className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2.5 text-base font-bold text-ink-muted shadow-[0_1px_0_hsl(150_10%_90%),_0_8px_24px_-12px_hsl(150_20%_15%/0.15)] transition-colors hover:text-ink"
    >
      <span className="inline-flex items-center gap-1.5">
        <StarIcon className="h-[18px] w-[18px]" aria-hidden />
        <span>Star</span>
        <span aria-hidden className="text-ink-subtle">
          {formatStars(stars)}
        </span>
      </span>
      <span className="h-5 w-px bg-border" aria-hidden />
      <GithubMarkIcon className="h-[22px] w-[22px]" aria-hidden />
    </a>
  );
}
