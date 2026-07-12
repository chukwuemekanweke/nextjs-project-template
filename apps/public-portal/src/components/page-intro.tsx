import { Hero } from "@template/public-ui";
import { site } from "@/config/site";
export function PageIntro({
  eyebrow,
  title,
  highlighted,
  description,
}: {
  eyebrow: string;
  title: string;
  highlighted: string;
  description: string;
}) {
  return (
    <Hero
      eyebrow={eyebrow}
      title={title}
      highlighted={highlighted}
      description={description}
      primaryAction={site.register}
      secondaryAction={{ label: "Contact us", href: "/contact" }}
    />
  );
}
