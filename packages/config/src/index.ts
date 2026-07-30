import { z } from "zod";

const url = z.url().transform((value) => value.replace(/\/$/, ""));
const nonEmpty = z.string().trim().min(1);

export const serverEnvironmentSchema = z.object({
  API_BASE_URL: url,
  APP_ENVIRONMENT: z.enum(["development", "test", "staging", "production"]),
  APPLICATION_NAME: nonEmpty,
  APPLICATION_VERSION: nonEmpty,
});

export const browserEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: url,
  NEXT_PUBLIC_APP_ENVIRONMENT: z.enum([
    "development",
    "test",
    "staging",
    "production",
  ]),
  NEXT_PUBLIC_APPLICATION_NAME: nonEmpty,
  NEXT_PUBLIC_APPLICATION_VERSION: nonEmpty,
});

export const browserBrandingEnvironmentSchema = z.object({
  NEXT_PUBLIC_PRODUCT_NAME: nonEmpty,
  NEXT_PUBLIC_ORGANIZATION_NAME: nonEmpty,
  NEXT_PUBLIC_LOGO_LIGHT: nonEmpty,
  NEXT_PUBLIC_LOGO_DARK: nonEmpty,
  NEXT_PUBLIC_FAVICON: nonEmpty,
  NEXT_PUBLIC_BRAND_PRIMARY_COLOUR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_BRAND_ACCENT_COLOUR: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.email(),
  NEXT_PUBLIC_COPYRIGHT: nonEmpty,
  NEXT_PUBLIC_USER_PORTAL_NAME: nonEmpty,
  NEXT_PUBLIC_ADMIN_PORTAL_NAME: nonEmpty,
  NEXT_PUBLIC_PUBLIC_PORTAL_NAME: nonEmpty,
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type BrowserEnvironment = z.infer<typeof browserEnvironmentSchema>;

type EnvironmentShape = Record<string, string | undefined>;

function parse<TSchema extends z.ZodType>(
  schema: TSchema,
  values: EnvironmentShape,
  scope: string,
): z.infer<TSchema> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new Error(
      `Invalid ${scope} environment configuration:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/** Validates server-only values. Do not prefix secrets with NEXT_PUBLIC_. */
export function createServerEnvironment<TExtension extends z.ZodRawShape>(
  extension: z.ZodObject<TExtension>,
  values: EnvironmentShape = process.env,
) {
  return Object.freeze(
    parse(serverEnvironmentSchema.extend(extension.shape), values, "server"),
  );
}

/** Validates only values intentionally exposed to browser bundles. */
export function createBrowserEnvironment<TExtension extends z.ZodRawShape>(
  extension: z.ZodObject<TExtension>,
  values: EnvironmentShape,
) {
  return Object.freeze(
    parse(browserEnvironmentSchema.extend(extension.shape), values, "browser"),
  );
}

export const brandingSchema = z.object({
  productName: nonEmpty,
  organizationName: nonEmpty,
  logo: z.object({ light: nonEmpty, dark: nonEmpty, alt: nonEmpty }),
  favicon: nonEmpty,
  colours: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  supportEmail: z.email(),
  copyright: nonEmpty,
  portals: z.object({ user: nonEmpty, admin: nonEmpty, public: nonEmpty }),
});

export type Branding = z.infer<typeof brandingSchema>;

export function defineBranding(branding: Branding): Readonly<Branding> {
  return Object.freeze(brandingSchema.parse(branding));
}

export function brandingFromEnvironment(
  environment: z.infer<typeof browserBrandingEnvironmentSchema>,
): Readonly<Branding> {
  return defineBranding({
    productName: environment.NEXT_PUBLIC_PRODUCT_NAME,
    organizationName: environment.NEXT_PUBLIC_ORGANIZATION_NAME,
    logo: {
      light: environment.NEXT_PUBLIC_LOGO_LIGHT,
      dark: environment.NEXT_PUBLIC_LOGO_DARK,
      alt: environment.NEXT_PUBLIC_PRODUCT_NAME,
    },
    favicon: environment.NEXT_PUBLIC_FAVICON,
    colours: {
      primary: environment.NEXT_PUBLIC_BRAND_PRIMARY_COLOUR,
      accent: environment.NEXT_PUBLIC_BRAND_ACCENT_COLOUR,
    },
    supportEmail: environment.NEXT_PUBLIC_SUPPORT_EMAIL,
    copyright: environment.NEXT_PUBLIC_COPYRIGHT,
    portals: {
      user: environment.NEXT_PUBLIC_USER_PORTAL_NAME,
      admin: environment.NEXT_PUBLIC_ADMIN_PORTAL_NAME,
      public: environment.NEXT_PUBLIC_PUBLIC_PORTAL_NAME,
    },
  });
}
