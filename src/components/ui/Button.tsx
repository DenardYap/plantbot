import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Variant = "primary" | "brand";

const baseCls =
  "inline-flex items-center justify-center rounded-full font-extrabold transition-colors focus-visible:outline-none disabled:cursor-not-allowed";

const variantCls: Record<Variant, string> = {
  // Dark primary — used for top-of-hierarchy actions on light backgrounds
  primary:
    "bg-ink text-ink-inverse hover:bg-grey-800 disabled:bg-grey-300 disabled:text-ink-subtle",
  // Green brand — used in embedded contexts (e.g. inside a chat input)
  brand:
    "bg-brand text-ink-inverse hover:bg-brand-hover disabled:bg-grey-300 disabled:text-ink-subtle",
};

const paddedCls = "px-5 py-3 text-sm";

type ButtonVariantProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonVariantProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button
      {...rest}
      className={[baseCls, variantCls[variant], paddedCls, className].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * Next.js Link styled as a Button. Kept separate from `Button` so server
 * components can route without shipping an onClick handler to the client.
 */
export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonVariantProps & {
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">) {
  return (
    <Link
      href={href}
      {...rest}
      className={[baseCls, variantCls[variant], paddedCls, className].join(" ")}
    >
      {children}
    </Link>
  );
}

/**
 * Square, icon-only button. Children should be a single icon sized to
 * 16–20px; the 40×40 hit area comes from the component, not the icon.
 */
export function IconButton({
  variant = "brand",
  className = "",
  children,
  ...rest
}: ButtonVariantProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button
      {...rest}
      className={[baseCls, variantCls[variant], "h-10 w-10", className].join(" ")}
    >
      {children}
    </button>
  );
}
