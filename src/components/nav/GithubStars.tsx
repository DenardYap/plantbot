import { SITE } from "@/lib/site";
import { StarIcon, GithubMarkIcon } from "@/components/icons";

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(k < 10 ? 1 : 0)}k`;
  }
  return String(n);
}

async function fetchStarCount(repo: string): Promise<number> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return SITE.github.stars;
    const data = await res.json();
    return data.stargazers_count ?? SITE.github.stars;
  } catch {
    return SITE.github.stars;
  }
}

export async function GithubStars() {
  const { url: repoUrl, repo } = SITE.github;
  const stars = await fetchStarCount(repo);

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
