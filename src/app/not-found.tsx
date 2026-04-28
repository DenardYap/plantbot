import { PageContainer } from "@/components/layout/PageContainer";
import { ButtonLink, PageHeader } from "@/components/ui";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="py-16">
        <PageHeader
          eyebrow="404"
          title="That plant wandered off."
          lead="We couldn't find the page you were looking for. It might have been moved, or it never existed in the first place."
          align="center"
        />
        <div className="mx-auto mt-8 max-w-xl text-center">
          <ButtonLink href="/plants">Back to the garden</ButtonLink>
        </div>
      </div>
    </PageContainer>
  );
}
