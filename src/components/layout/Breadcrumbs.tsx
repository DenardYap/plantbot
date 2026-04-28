import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-full px-2 py-1 font-bold hover:bg-grey-100 hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="px-2 py-1 font-bold text-ink"
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRightIcon
                  className="h-3.5 w-3.5 text-ink-subtle"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
