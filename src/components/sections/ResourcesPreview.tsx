import Image from "next/image";
import Link from "next/link";
import type { BlogArticle } from "@/types/content";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getArticles } from "@/lib/content";

export function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <article className="group border border-line bg-surface hover:border-ink/30 transition">
      <Link href={`/resources/${article.slug}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            {article.category} · {article.readTime}
          </p>
          <h3 className="font-heading mt-2 text-xl leading-snug">{article.title}</h3>
          <p className="mt-2 text-sm text-muted">{article.excerpt}</p>
        </div>
      </Link>
    </article>
  );
}

export function ResourcesPreview() {
  const articles = getArticles().slice(0, 3);
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="flex items-end justify-between gap-4 mb-10">
          <SectionHeader
            eyebrow="Auto Guide"
            title="Practical notes from the bay"
            description="Maintenance intervals, warning lights, and trip prep—written like a briefing, not a brochure."
          />
          <Link href="/resources" className="text-xs uppercase tracking-[0.16em] border-b border-accent pb-0.5">
            All articles
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {articles.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      </Container>
    </section>
  );
}
