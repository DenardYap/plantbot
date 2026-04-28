"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DocumentIcon,
  InfoCircleIcon,
  PlantPotIcon,
} from "@/components/icons";
import type { SVGProps } from "react";

type IconType = (props: SVGProps<SVGSVGElement>) => React.ReactElement;

type NavLink = {
  href: string;
  label: string;
  Icon: IconType;
  match: (pathname: string) => boolean;
};

const LINKS: readonly NavLink[] = [
  {
    href: "/plants",
    label: "Plants",
    Icon: PlantPotIcon,
    match: (p) => p === "/" || p.startsWith("/plants"),
  },
  {
    href: "/about",
    label: "About",
    Icon: InfoCircleIcon,
    match: (p) => p.startsWith("/about"),
  },
  {
    href: "/guide",
    label: "Guide",
    Icon: DocumentIcon,
    match: (p) => p.startsWith("/guide"),
  },
] as const;

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            // `prefetch` is off by default in dev; forcing it on compiles
            // the target route alongside the current one so nav feels
            // instant instead of waiting for on-demand compile.
            prefetch
            aria-current={active ? "page" : undefined}
            // On inactive items, expose the label via `title` so hovering
            // still surfaces the destination (belt-and-suspenders with the
            // always-in-DOM text below).
            title={active ? undefined : label}
            className={[
              "group inline-flex items-center rounded-full p-1",
              "text-base font-extrabold transition-colors duration-200",
              active
                ? "bg-ink text-ink-inverse"
                : "text-ink-muted hover:bg-grey-100 hover:text-ink",
            ].join(" ")}
          >
            {/* Icon lives outside the animating label so it's always visible.
                Wrapper is square — combined with the Link's symmetric padding,
                inactive items render as a perfect circle on hover. */}
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center"
            >
              <Icon className="h-5 w-5" />
            </span>

            {/*
             * Animated label container.
             * `min-w-0` is load-bearing — as a flex child of the Link,
             * the default `min-width: auto` resolves to the label's
             * min-content width, which would override `max-width: 0` and
             * leave the hover pill stretched to the right of the icon.
             */}
            <span
              className={[
                "min-w-0 overflow-hidden whitespace-nowrap",
                "transition-[max-width,opacity,padding] duration-300 ease-out",
                "motion-reduce:transition-none",
                active
                  ? "max-w-[10rem] pl-1 pr-2 opacity-100"
                  : "max-w-0 px-0 opacity-0",
              ].join(" ")}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </>
  );
}
