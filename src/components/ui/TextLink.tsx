import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

const cls =
  "font-bold text-brand underline decoration-2 underline-offset-4 hover:text-brand-hover";

/**
 * Inline link style used in paragraph copy. Keeps the underline thick and
 * offset so brand-colored links stay obvious without turning into buttons.
 *
 * `external` renders a raw anchor with safe rel/target; default renders a
 * Next.js Link for internal routes.
 */
export function TextLink({
  href,
  children,
  external = false,
  className = "",
  ...rest
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  const merged = [cls, className].join(" ");
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={merged}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={merged} {...rest}>
      {children}
    </Link>
  );
}
