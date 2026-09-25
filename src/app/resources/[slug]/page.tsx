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
      <div className="relative min-h-[42vh] bg-primary text-inverted">
        <Image src={article.image} alt={article.title} fill className="object-cover opacity-40" priority sizes="100vw" />
        <Container className="relative z-10 pt-32 pb-14">
          <p className="text-[12px] uppercase tracking-[0.2em] text-accent">
            {article.category} · {article.readTime} · {article.date}
          </p>
          <h1 className="font-heading mt-3 text-4xl sm:text-5xl max-w-4xl">{article.title}</h1>
          <p className="mt-4 text-inverted/70">{article.author}</p>
        </Container>
      </div>
      <Container className="py-16 max-w-3xl">
        {article.content.map((block, index) => (
          <section key={index} className="mb-8">
            {block.heading ? <h2 className="font-heading text-2xl mb-3">{block.heading}</h2> : null}
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-muted leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </Container>
    </article>
  );
}
