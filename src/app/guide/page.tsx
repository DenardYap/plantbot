import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Guide",
  description: "A step-by-step guide to building your own PlantBot.",
  alternates: { canonical: "/guide" },
};

export default function GuidePage() {
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">
          Coming soon
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">
          Guide is on its way.
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-muted">
          A full step-by-step walkthrough for building your own PlantBot is in
          the works. Check back soon.
        </p>
      </div>
    </PageContainer>
  );
}
