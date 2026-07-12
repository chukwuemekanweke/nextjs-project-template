import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function FormField({
  label,
  hint,
  error,
  children,
}: Readonly<{
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-sm text-red-500">{error}</span>
      ) : hint ? (
        <span className="text-sm text-gray-500 dark:text-gray-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function FormLabel({
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={[
        "text-sm font-medium text-gray-700 dark:text-gray-400",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

function fieldClasses(className: string) {
  return [
    "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition",
    "placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800",
    className,
  ].join(" ");
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldClasses(className)} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={fieldClasses(className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className = "",
  rows = 5,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={fieldClasses(className)} rows={rows} {...props} />
  );
}
