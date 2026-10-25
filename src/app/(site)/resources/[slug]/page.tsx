import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Layout";
import { getArticle, getArticles } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article" };
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <article>
      <section className="relative overflow-hidden bg-primary pt-[76px] text-inverted">
        <div className="relative min-h-[34rem]">
          <Image src={article.image} alt={article.title} fill preload className="object-cover opacity-55" sizes="100vw" />
          <div className="absolute inset-0 bg-primary/45" />
          <Container className="relative z-10 flex min-h-[34rem] flex-col justify-end pb-12 pt-20 sm:pb-16">
            <div className="flex flex-wrap items-center gap-3 border-b border-white/15 pb-4">
              <p className="meta text-accent">{article.category}</p>
              <span className="text-inverted/30">/</span>
              <p className="meta text-inverted/55">{article.readTime}</p>
              <span className="text-inverted/30">/</span>
              <p className="meta text-inverted/55">{article.date}</p>
            </div>
            <h1 className="display mt-5 max-w-5xl text-5xl sm:text-7xl lg:text-[5.5rem]">{article.title}</h1>
            <p className="mt-5 text-sm text-inverted/65">{article.author}</p>
          </Container>
        </div>
      </section>

      <Container className="max-w-3xl py-16 sm:py-20">
        {article.content.map((block, index) => (
          <section key={index} className="mb-10 border-t border-line pt-8 first:border-t-0 first:pt-0">
            {block.heading ? <h2 className="font-heading text-4xl leading-tight">{block.heading}</h2> : null}
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-4 text-base leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </Container>
    </article>
  );
}
