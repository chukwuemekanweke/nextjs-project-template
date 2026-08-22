import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { forwardRef } from "react";

export function FormField({
  label,
  hint,
  error,
  inputId,
  descriptionId,
  required = false,
  children,
}: Readonly<{
  label: string;
  hint?: string;
  error?: string;
  inputId?: string;
  descriptionId?: string;
  required?: boolean;
  children: ReactNode;
}>) {
  return (
    <div className="grid gap-2">
      <label
        className="text-sm font-medium text-gray-700 dark:text-gray-400"
        htmlFor={inputId}
      >
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <span className="text-sm text-red-500" id={descriptionId} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span
          className="text-sm text-gray-500 dark:text-gray-400"
          id={descriptionId}
        >
          {hint}
        </span>
      ) : null}
    </div>
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

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return <input className={fieldClasses(className)} ref={ref} {...props} />;
});

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
