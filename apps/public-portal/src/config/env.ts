import {
  brandingFromEnvironment,
  browserBrandingEnvironmentSchema,
  createBrowserEnvironment,
} from "@template/config";
import { z } from "zod";

const environment = createBrowserEnvironment(
  browserBrandingEnvironmentSchema.extend({
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_USER_PORTAL_URL: z.url(),
    NEXT_PUBLIC_PRODUCT_DESCRIPTION: z.string().trim().min(1),
    NEXT_PUBLIC_CONTACT_ADDRESS: z.string().trim().min(1),
  }),
  {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT,
    NEXT_PUBLIC_APPLICATION_NAME: process.env.NEXT_PUBLIC_APPLICATION_NAME,
    NEXT_PUBLIC_APPLICATION_VERSION:
      process.env.NEXT_PUBLIC_APPLICATION_VERSION,
    NEXT_PUBLIC_PRODUCT_NAME: process.env.NEXT_PUBLIC_PRODUCT_NAME,
    NEXT_PUBLIC_ORGANIZATION_NAME: process.env.NEXT_PUBLIC_ORGANIZATION_NAME,
    NEXT_PUBLIC_LOGO_LIGHT: process.env.NEXT_PUBLIC_LOGO_LIGHT,
    NEXT_PUBLIC_LOGO_DARK: process.env.NEXT_PUBLIC_LOGO_DARK,
    NEXT_PUBLIC_FAVICON: process.env.NEXT_PUBLIC_FAVICON,
    NEXT_PUBLIC_BRAND_PRIMARY_COLOUR:
      process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOUR,
    NEXT_PUBLIC_BRAND_ACCENT_COLOUR:
      process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOUR,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    NEXT_PUBLIC_COPYRIGHT: process.env.NEXT_PUBLIC_COPYRIGHT,
    NEXT_PUBLIC_USER_PORTAL_NAME: process.env.NEXT_PUBLIC_USER_PORTAL_NAME,
    NEXT_PUBLIC_ADMIN_PORTAL_NAME: process.env.NEXT_PUBLIC_ADMIN_PORTAL_NAME,
    NEXT_PUBLIC_PUBLIC_PORTAL_NAME: process.env.NEXT_PUBLIC_PUBLIC_PORTAL_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_USER_PORTAL_URL: process.env.NEXT_PUBLIC_USER_PORTAL_URL,
    NEXT_PUBLIC_PRODUCT_DESCRIPTION:
      process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
    NEXT_PUBLIC_CONTACT_ADDRESS: process.env.NEXT_PUBLIC_CONTACT_ADDRESS,
  },
);

export const env = Object.freeze({
  apiBaseUrl: environment.NEXT_PUBLIC_API_BASE_URL,
  appEnvironment: environment.NEXT_PUBLIC_APP_ENVIRONMENT,
  applicationName: environment.NEXT_PUBLIC_APPLICATION_NAME,
  applicationVersion: environment.NEXT_PUBLIC_APPLICATION_VERSION,
  siteUrl: environment.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
  userPortalUrl: environment.NEXT_PUBLIC_USER_PORTAL_URL.replace(/\/$/, ""),
  productDescription: environment.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
  contactAddress: environment.NEXT_PUBLIC_CONTACT_ADDRESS,
});

export const branding = brandingFromEnvironment(environment);

export function userPortalHref(path: `/${string}`): string {
  return `${env.userPortalUrl}${path}`;
}
