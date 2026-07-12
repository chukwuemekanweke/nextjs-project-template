"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

export type LinkItem = { label: string; href: string };
export type Action = LinkItem;
export type FeatureItem = {
  title: string;
  description: string;
  icon?: ReactNode;
};
export type PricePlan = {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  action: Action;
};
export type FaqItem = { question: string; answer: string };
export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  image: string;
};
export type LogoItem = {
  name: string;
  lightImage: string;
  darkImage?: string;
  href?: string;
};
export type BlogPost = {
  title: string;
  excerpt: string;
  image: string;
  href: string;
};

const reveal = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export function PublicUiProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      aria-label="toggle color theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="bg-stroke dark:bg-hoverdark flex h-8 w-8 items-center justify-center rounded-full"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

export function Header({
  logoAlt,
  navigation,
  signIn,
  register,
}: {
  logoAlt: string;
  navigation: LinkItem[];
  signIn: Action;
  register: Action;
}) {
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const update = () => setSticky(window.scrollY >= 80);
    update();
    window.addEventListener("scroll", update);
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header
      className={`fixed top-0 left-0 z-99999 w-full py-7 ${sticky ? "bg-white py-4! shadow-sm transition duration-100 dark:bg-black" : ""}`}
    >
      <div className="max-w-c-1390 relative mx-auto items-center justify-between px-4 md:px-8 xl:flex 2xl:px-0">
        <div className="flex w-full items-center justify-between xl:w-1/4">
          <Link href="/">
            <Image
              src="/images/logo/logo-light.svg"
              alt={logoAlt}
              width={119}
              height={30}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-dark.svg"
              alt={logoAlt}
              width={119}
              height={30}
              className="hidden dark:block"
            />
          </Link>
          <button
            aria-label="Toggle navigation"
            className="text-2xl xl:hidden"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
        <div
          className={`${open ? "navbar shadow-solid-5 dark:bg-blacksection visible! mt-4 h-auto rounded-md bg-white p-7.5" : "invisible h-0"} w-full items-center justify-between xl:visible xl:flex xl:h-auto xl:bg-transparent xl:p-0 xl:shadow-none`}
        >
          <nav>
            <ul className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-10">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      pathname === item.href
                        ? "text-primary"
                        : "hover:text-primary"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-7 flex items-center gap-6 xl:mt-0">
            <ThemeToggle />
            <Link
              href={signIn.href}
              className="text-waterloo hover:text-primary font-medium"
            >
              {signIn.label}
            </Link>
            <Link
              href={register.href}
              className="bg-primary hover:bg-primaryho rounded-full px-7.5 py-2.5 text-white"
            >
              {register.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer({
  description,
  navigation,
  legal,
}: {
  description: string;
  navigation: LinkItem[];
  legal: LinkItem[];
}) {
  return (
    <footer className="border-stroke dark:border-strokedark dark:bg-blacksection border-t bg-white pt-20 pb-10 lg:pt-25">
      <div className="max-w-c-1390 mx-auto px-4 md:px-8 2xl:px-0">
        <div className="flex flex-wrap gap-8 lg:justify-between">
          <div className="max-w-sm">
            <Image
              src="/images/logo/logo-light.svg"
              alt="Product"
              width={119}
              height={30}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-dark.svg"
              alt="Product"
              width={119}
              height={30}
              className="hidden dark:block"
            />
            <p className="mt-5">{description}</p>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-medium text-black dark:text-white">
              Explore
            </h4>
            <ul className="space-y-3">
              {navigation.map((x) => (
                <li key={x.href}>
                  <Link className="hover:text-primary" href={x.href}>
                    {x.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-lg font-medium text-black dark:text-white">
              Legal
            </h4>
            <ul className="space-y-3">
              {legal.map((x) => (
                <li key={x.href}>
                  <Link className="hover:text-primary" href={x.href}>
                    {x.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-stroke dark:border-strokedark mt-12 border-t pt-7 text-sm">
          © {new Date().getFullYear()} Product. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function Hero({
  eyebrow,
  title,
  highlighted,
  description,
  primaryAction,
  secondaryAction,
}: {
  eyebrow: string;
  title: string;
  highlighted: string;
  description: string;
  primaryAction: Action;
  secondaryAction?: Action;
}) {
  return (
    <section className="overflow-hidden pt-35 pb-20 md:pt-40 xl:pt-46 xl:pb-25">
      <div className="max-w-c-1390 mx-auto px-4 md:px-8 2xl:px-0">
        <div className="flex lg:items-center lg:gap-8 xl:gap-32.5">
          <div className="md:w-1/2">
            <h4 className="mb-4.5 text-lg font-medium text-black dark:text-white">
              {eyebrow}
            </h4>
            <h1 className="xl:text-hero mb-5 text-3xl font-bold text-black dark:text-white">
              {title}{" "}
              <span className="before:bg-titlebg dark:before:bg-titlebgdark relative inline-block before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full">
                {highlighted}
              </span>
            </h1>
            <p>{description}</p>
            <div className="mt-10 flex flex-wrap gap-5">
              <Link
                className="hover:bg-blackho dark:bg-btndark rounded-full bg-black px-7.5 py-2.5 text-white"
                href={primaryAction.href}
              >
                {primaryAction.label}
              </Link>
              {secondaryAction && (
                <Link
                  className="border-stroke dark:border-strokedark rounded-full border px-7.5 py-2.5 text-black dark:text-white"
                  href={secondaryAction.href}
                >
                  {secondaryAction.label}
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:w-1/2 lg:block">
            <div className="relative aspect-700/444 w-full">
              <Image
                className="shadow-solid-l dark:hidden"
                src="/images/hero/hero-light.svg"
                alt="Product preview"
                fill
                priority
              />
              <Image
                className="shadow-solid-l hidden dark:block"
                src="/images/hero/hero-dark.svg"
                alt="Product preview"
                fill
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-12.5 max-w-3xl text-center">
      {eyebrow && (
        <span className="text-primary font-medium uppercase">{eyebrow}</span>
      )}
      <h2 className="xl:text-sectiontitle2 mt-2 text-3xl font-bold text-black dark:text-white">
        {title}
      </h2>
      {description && <p className="mt-4">{description}</p>}
    </div>
  );
}

export function Features({
  heading,
  items,
}: {
  heading: string;
  items: FeatureItem[];
}) {
  return (
    <section className="py-20 lg:py-25">
      <div className="max-w-c-1315 mx-auto px-4 md:px-8 xl:px-0">
        <SectionHeading eyebrow="Core features" title={heading} />
        <div className="grid gap-7.5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((x, i) => (
            <motion.article
              key={x.title}
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="shadow-solid-3 dark:bg-blacksection rounded-lg bg-white p-7.5 xl:p-12.5"
            >
              <div className="bg-primary mb-7.5 flex h-15 w-15 items-center justify-center rounded-[4px] text-xl text-white">
                {x.icon ?? String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="xl:text-itemtitle mb-5 text-xl font-semibold text-black dark:text-white">
                {x.title}
              </h3>
              <p>{x.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cta({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: Action;
}) {
  return (
    <section className="px-4 py-20 md:px-8">
      <div className="max-w-c-1390 bg-primary relative mx-auto overflow-hidden rounded-lg px-7.5 py-12 text-center text-white md:px-12.5 lg:py-17.5">
        <Image
          src="/images/shape/shape-04.png"
          alt=""
          width={300}
          height={300}
          className="absolute top-0 left-0 opacity-30"
        />
        <div className="relative">
          <h2 className="xl:text-sectiontitle2 text-3xl font-bold">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">{description}</p>
          <Link
            href={action.href}
            className="text-primary mt-8 inline-flex rounded-full bg-white px-7.5 py-3 font-medium"
          >
            {action.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Pricing({
  heading,
  plans,
}: {
  heading: string;
  plans: PricePlan[];
}) {
  return (
    <section className="overflow-hidden py-20 lg:py-25">
      <div className="max-w-c-1315 mx-auto px-4 md:px-8 xl:px-0">
        <SectionHeading eyebrow="Pricing" title={heading} />
        <div className="grid gap-7.5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="border-stroke shadow-solid-10 dark:border-strokedark dark:bg-blacksection rounded-lg border bg-white p-7.5 xl:p-12.5"
            >
              <h3 className="text-2xl font-semibold text-black dark:text-white">
                {plan.name}
              </h3>
              <div className="my-6">
                <span className="text-4xl font-bold text-black dark:text-white">
                  {plan.price}
                </span>
                {plan.cadence && <span>/{plan.cadence}</span>}
              </div>
              <p>{plan.description}</p>
              <ul className="my-8 space-y-3">
                {plan.features.map((x) => (
                  <li key={x}>✓ {x}</li>
                ))}
              </ul>
              <Link
                href={plan.action.href}
                className="bg-primary inline-flex rounded-full px-7.5 py-3 text-white"
              >
                {plan.action.label}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq({ heading, items }: { heading: string; items: FaqItem[] }) {
  const [active, setActive] = useState(0);
  return (
    <section className="py-20 lg:py-25">
      <div className="max-w-c-1016 mx-auto px-4 md:px-8">
        <SectionHeading eyebrow="FAQ" title={heading} />
        <div className="space-y-4">
          {items.map((x, i) => (
            <div
              key={x.question}
              className="shadow-solid-8 dark:bg-blacksection rounded-lg bg-white p-6"
            >
              <button
                className="flex w-full items-center justify-between text-left text-lg font-medium text-black dark:text-white"
                onClick={() => setActive(active === i ? -1 : i)}
              >
                {x.question}
                <span>{active === i ? "−" : "+"}</span>
              </button>
              {active === i && <p className="pt-4">{x.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials({
  heading,
  items,
}: {
  heading: string;
  items: TestimonialItem[];
}) {
  return (
    <section className="bg-alabaster dark:bg-blacksection py-20 lg:py-25">
      <div className="max-w-c-1315 mx-auto px-4 md:px-8 xl:px-0">
        <SectionHeading eyebrow="Testimonials" title={heading} />
        <div className="grid gap-7.5 lg:grid-cols-3">
          {items.map((x) => (
            <figure
              key={x.name}
              className="shadow-solid-9 rounded-lg bg-white p-7.5 dark:bg-black"
            >
              <blockquote>“{x.quote}”</blockquote>
              <figcaption className="mt-7 flex items-center gap-4">
                <Image
                  src={x.image}
                  alt=""
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div>
                  <strong className="block text-black dark:text-white">
                    {x.name}
                  </strong>
                  <span className="text-sm">{x.role}</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LogoCloud({ items }: { items: LogoItem[] }) {
  return (
    <section className="border-stroke dark:border-strokedark border-y py-11">
      <div className="max-w-c-1390 mx-auto flex flex-wrap items-center justify-center gap-10 px-4 md:justify-between md:px-8">
        {items.map((x) => (
          <a
            key={x.name}
            href={x.href ?? "#"}
            aria-label={x.name}
            className="relative h-10 w-32 opacity-65 hover:opacity-100"
          >
            <Image
              src={x.lightImage}
              alt={x.name}
              fill
              className="object-contain dark:hidden"
            />
            {x.darkImage && (
              <Image
                src={x.darkImage}
                alt={x.name}
                fill
                className="hidden object-contain dark:block"
              />
            )}
          </a>
        ))}
      </div>
    </section>
  );
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <motion.article
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="shadow-solid-8 dark:bg-blacksection rounded-lg bg-white p-4 pb-9"
    >
      <Link href={post.href} className="relative block aspect-368/239">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="rounded-sm object-cover"
        />
      </Link>
      <div className="px-4">
        <h3 className="hover:text-primary xl:text-itemtitle2 mt-7.5 mb-3.5 text-lg font-medium text-black dark:text-white">
          <Link href={post.href}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
      </div>
    </motion.article>
  );
}

export function ContactSection({
  heading,
  description,
  email,
  address,
}: {
  heading: string;
  description: string;
  email: string;
  address: string;
}) {
  const submit = (e: FormEvent) => e.preventDefault();
  return (
    <section className="px-4 py-20 md:px-8">
      <div className="max-w-c-1390 mx-auto flex flex-col-reverse gap-8 rounded-lg bg-linear-to-t from-transparent to-[#dee7ff47] px-7.5 py-10 md:flex-row lg:p-15 dark:to-[#252A42]">
        <form
          onSubmit={submit}
          className="shadow-solid-8 w-full rounded-lg bg-white p-7.5 md:w-3/5 xl:p-15 dark:bg-black"
        >
          <h2 className="mb-10 text-3xl font-semibold text-black dark:text-white">
            {heading}
          </h2>
          <div className="grid gap-7.5 lg:grid-cols-2">
            <input
              aria-label="Full name"
              required
              placeholder="Full name"
              className="border-stroke focus:border-primary border-b bg-transparent pb-3.5 outline-none"
            />
            <input
              aria-label="Email address"
              required
              type="email"
              placeholder="Email address"
              className="border-stroke focus:border-primary border-b bg-transparent pb-3.5 outline-none"
            />
          </div>
          <textarea
            aria-label="Message"
            required
            rows={4}
            placeholder="Message"
            className="border-stroke focus:border-primary mt-8 w-full border-b bg-transparent pb-3.5 outline-none"
          />
          <button className="dark:bg-btndark mt-8 rounded-full bg-black px-6 py-3 text-white">
            Send Message
          </button>
        </form>
        <aside className="w-full md:w-2/5 md:p-7.5">
          <h2 className="mb-6 text-3xl font-semibold text-black dark:text-white">
            Find us
          </h2>
          <p className="mb-7">{description}</p>
          <h3 className="font-medium text-black dark:text-white">
            Our location
          </h3>
          <p className="mb-7">{address}</p>
          <h3 className="font-medium text-black dark:text-white">
            Email address
          </h3>
          <a href={`mailto:${email}`}>{email}</a>
        </aside>
      </div>
    </section>
  );
}
