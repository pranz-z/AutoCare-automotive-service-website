import type { Metadata } from "next";
import { BlogCard } from "@/components/sections/ResourcesPreview";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getArticles, getCompany } from "@/lib/content";

export const metadata: Metadata = {
  title: "Auto Guide",
  description: `Maintenance articles from ${getCompany().name}.`,
};

export default function ResourcesPage() {
  const articles = getArticles();
  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Auto Guide"
        description="Practical maintenance writing—intervals, warning lights, and trip prep."
      />
      <Container className="grid gap-x-10 py-16 sm:py-20 md:grid-cols-2">
        {articles.map((article) => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </Container>
    </>
  );
}
