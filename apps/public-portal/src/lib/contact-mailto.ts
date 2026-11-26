/** Topics offered on the contact form; they only label the email subject. */
export const CONTACT_TOPICS = [
  "General",
  "Sales",
  "Support",
  "Partnerships",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export type ContactMessage = Readonly<{
  email: string;
  message: string;
  name: string;
  topic: ContactTopic;
}>;

/**
 * A `mailto:` link that opens the visitor's email app with the message
 * addressed to `to`. There is no contact endpoint (DR-033), so nothing is
 * sent from the site itself. Line breaks use CRLF as RFC 6068 requires.
 */
export function contactMailtoHref(to: string, message: ContactMessage): string {
  const name = message.name.trim();
  const subject = `${message.topic} enquiry from ${name}`;
  const body = `${message.message.trim()}\n\n${name}\n${message.email.trim()}`;
  const encode = (value: string) =>
    encodeURIComponent(value.replace(/\r?\n/g, "\r\n"));
  return `mailto:${to}?subject=${encode(subject)}&body=${encode(body)}`;
}
