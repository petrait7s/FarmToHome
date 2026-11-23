import { notFound } from "next/navigation";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  if (!page || !page.published) notFound();
  const { locale } = await getT();
  return (
    <article className="container narrow page-pad" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <h1 className="h1" style={{ marginBottom: 24 }}>{localized(page, "title", locale)}</h1>
      {localized(page, "body", locale).split(/\n{2,}/).map((para, i) => <p key={i} style={{ marginBottom: 16 }}>{para}</p>)}
    </article>
  );
}
