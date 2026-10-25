import Image from "next/image";
import Link from "next/link";
import type { BlogArticle } from "@/types/content";
import { Container, SectionHeader } from "@/components/ui/Layout";
import { getArticles } from "@/lib/content";

export function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <article className="group border-t border-line">
      <Link href={`/resources/${article.slug}`} className="grid gap-4 py-5 sm:grid-cols-[11rem_1fr] sm:items-center">
        <div className="relative h-44 overflow-hidden border border-line bg-primary sm:h-32">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover opacity-85 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 176px"
          />
        </div>
        <div>
          <p className="meta text-accent">
            {article.category} · {article.readTime}
          </p>
          <h3 className="mt-2 font-heading text-2xl leading-tight">{article.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{article.excerpt}</p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-muted">{article.date}</p>
        </div>
      </Link>
    </article>
  );
}

export function ResourcesPreview() {
  const articles = getArticles();
  const [featured, ...rest] = articles.slice(0, 3);

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:flex-1">
            <SectionHeader
              eyebrow="Auto Guide"
              title="Practical notes from the bay"
              description="Maintenance intervals, warning lights, and trip prep—written like a briefing, not a brochure."
            />
          </div>
          <Link
            href="/resources"
            className="inline-flex shrink-0 items-center border-b border-accent pb-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
          >
            All articles
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {featured ? (
            <article className="group relative min-h-[24rem] overflow-hidden border border-line bg-primary text-inverted lg:col-span-7">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover opacity-65 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              <div className="absolute inset-0 bg-primary/30" />
              <Link href={`/resources/${featured.slug}`} className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
                <p className="meta text-accent">
                  {featured.category} · {featured.readTime}
                </p>
                <h3 className="mt-3 max-w-xl font-heading text-4xl leading-[1.02] sm:text-5xl">{featured.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-inverted/70">{featured.excerpt}</p>
              </Link>
            </article>
          ) : null}

          <div className="border-b border-line lg:col-span-5">
            {rest.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
