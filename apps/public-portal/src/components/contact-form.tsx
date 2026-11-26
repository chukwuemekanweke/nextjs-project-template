"use client";

import {
  Button,
  FieldHint,
  FormField,
  Input,
  MailIcon,
  Select,
  Textarea,
} from "@template/ui-core";
import { useId, type FormEvent } from "react";
import {
  CONTACT_TOPICS,
  contactMailtoHref,
  type ContactTopic,
} from "@/lib/contact-mailto";

/**
 * Contact form (reference `PublicContact`). No contact endpoint exists
 * (DR-033), so submitting opens the visitor's email app with the message
 * addressed to the support email; the page never claims it was sent.
 */
export function ContactForm({ to }: Readonly<{ to: string }>) {
  const id = useId();
  const field = (name: string) => `${id}-${name}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    window.location.assign(
      contactMailtoHref(to, {
        email: String(data.get("email") ?? ""),
        message: String(data.get("message") ?? ""),
        name: String(data.get("name") ?? ""),
        topic: String(data.get("topic") ?? "General") as ContactTopic,
      }),
    );
  }

  return (
    <form
      aria-describedby={field("note")}
      className="flex flex-col gap-4"
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField inputId={field("name")} label="Name" required>
          <Input
            autoComplete="name"
            id={field("name")}
            name="name"
            placeholder="Your name"
            required
          />
        </FormField>
        <FormField inputId={field("email")} label="Email" required>
          <Input
            autoComplete="email"
            id={field("email")}
            name="email"
            placeholder="you@company.com"
            required
            type="email"
          />
        </FormField>
      </div>
      <FormField inputId={field("topic")} label="Topic">
        <Select defaultValue="General" id={field("topic")} name="topic">
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </Select>
      </FormField>
      <FormField inputId={field("message")} label="Message" required>
        <Textarea
          id={field("message")}
          name="message"
          placeholder="How can we help?"
          required
        />
      </FormField>
      <Button leadingIcon={<MailIcon />} type="submit">
        Continue in your email app
      </Button>
      <FieldHint id={field("note")}>
        This opens your email app with your message addressed to {to}. Nothing
        is sent until you send it from there.
      </FieldHint>
    </form>
  );
}
