"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type {
  Action,
  BlogPost,
  FaqItem,
  FeatureItem,
  LinkItem,
  LogoItem,
  PricePlan,
  TestimonialItem,
} from "../types";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      aria-label="toggle color theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="bg-stroke dark:bg-hoverdark flex h-8 w-8 items-center justify-center rounded-full"
    >
      {theme === "dark" ? "â˜€" : "â˜¾"}
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
            â˜°
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
