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
      <Container className="py-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <BlogCard key={article.slug} article={article} />
        ))}
      </Container>
    </>
  );
}
