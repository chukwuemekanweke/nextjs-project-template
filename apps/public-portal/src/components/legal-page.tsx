export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="pt-35 pb-25 md:pt-40">
      <article className="blog-details-docs blog-details max-w-c-1016 mx-auto px-4 md:px-8">
        <h1>{title}</h1>
        <p>Last updated: {updated}</p>
        {children}
      </article>
    </main>
  );
}
