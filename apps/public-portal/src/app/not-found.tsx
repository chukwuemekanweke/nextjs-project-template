import Image from "next/image";
import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center pt-35 pb-20">
      <div className="max-w-c-1016 mx-auto px-4 text-center md:px-8">
        <Image
          src="/images/shape/404.svg"
          alt="Page not found"
          width={650}
          height={350}
          className="mx-auto"
        />
        <h1 className="mt-8 text-3xl font-bold text-black dark:text-white">
          This page could not be found
        </h1>
        <p className="mt-4">
          The address may have changed, or the page may no longer exist.
        </p>
        <Link
          href="/"
          className="bg-primary mt-8 inline-flex rounded-full px-7.5 py-3 text-white"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
