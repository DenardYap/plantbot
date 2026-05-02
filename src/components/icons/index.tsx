import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Minimal inline icon set. Stroke-based, inherits `currentColor`.
 * Later we may migrate to lucide-react for a bigger library.
 */

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function StarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.3 6.6 20.1l1-6L3.3 9.9l6-.9L12 3.5z" />
    </svg>
  );
}

export function GithubMarkIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.1.8-.25.8-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.15.08 1.75 1.19 1.75 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.77 1.06.77 2.14 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.56 4.57-1.54 7.85-5.86 7.85-10.96C23.5 5.74 18.27.5 12 .5z" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20 4c0 8-6 14-14 14" />
      <path d="M20 4c-9 0-14 5-14 14" />
      <path d="M4 20l4-4" />
    </svg>
  );
}

export function PlantPotIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Pot */}
      <path d="M6 15h12l-1.2 5a1 1 0 01-1 .8H8.2a1 1 0 01-1-.8L6 15z" />
      <path d="M5.5 15h13" />
      {/* Stem */}
      <path d="M12 15V9" />
      {/* Left leaf */}
      <path d="M12 11c-3 0-5-1.5-5-4 2.5 0 5 1.5 5 4z" />
      {/* Right leaf */}
      <path d="M12 9c3 0 5-1.5 5-4-2.5 0-5 1.5-5 4z" />
    </svg>
  );
}

export function InfoCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8.25v.01" strokeWidth={2.25} />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h2" />
    </svg>
  );
}

export function DropletIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3s6 6 6 11a6 6 0 11-12 0c0-5 6-11 6-11z" />
    </svg>
  );
}

export function ThermometerIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 14.76V4a2 2 0 10-4 0v10.76a4 4 0 104 0z" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 4l14 8-14 8V4z" />
    </svg>
  );
}

export function LiveDotIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden {...props}>
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  );
}

export function CameraOffIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 3l18 18" />
      <path d="M5 7h2l1.5-2h7L17 7h2a2 2 0 012 2v9.5" />
      <path d="M21 21H5a2 2 0 01-2-2V9a2 2 0 012-2" />
      <path d="M9.6 9.6a4 4 0 005.7 5.6" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17v.01" strokeWidth={2.25} />
    </svg>
  );
}

export function ToolIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.5-.6-.6-2.5 2.6-2.4z" />
    </svg>
  );
}
