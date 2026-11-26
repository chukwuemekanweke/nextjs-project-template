import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updatePending: false,
}));

vi.mock("@/lib/server-api", () => ({
  createAppServerApiClient: async () => ({
    profiles: { getProfile: state.getProfile },
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@template/api-react/profiles", () => ({
  useCompleteAvatarUpload: () => ({ mutateAsync: vi.fn() }),
  useCreateAvatarUpload: () => ({ mutateAsync: vi.fn() }),
  useUpdateProfile: () => ({
    isPending: state.updatePending,
    mutateAsync: vi.fn(),
  }),
}));

import ProfilePage from "./page";

const profile = {
  avatarUrl: null as string | null,
  emailAddress: "grace@example.com",
  firstName: "Grace",
  isVerified: true,
  lastName: "Hopper",
  stakeholderId: "st-1",
};

const render = async () => renderToStaticMarkup(await ProfilePage());

beforeEach(() => {
  state.updatePending = false;
  state.getProfile.mockResolvedValue({ ...profile });
});

describe("Profile page", () => {
  it("renders the live profile in the photo and personal information cards", async () => {
    const markup = await render();

    expect(markup).toMatch(/<h1[^>]*>Profile<\/h1>/);
    expect(markup).toContain(">Photo<");
    expect(markup).toContain(">Personal information<");
    // React Hook Form applies the saved names as defaults on the client.
    expect(markup).toMatch(
      /<input[^>]*autoComplete="given-name"[^>]*name="firstName"/,
    );
    expect(markup).toMatch(
      /<input[^>]*autoComplete="family-name"[^>]*name="lastName"/,
    );
    expect(markup).toContain('aria-label="Grace Hopper"');
    expect(markup).toContain("Verified");
  });

  it("keeps the email address read-only", async () => {
    const markup = await render();
    const email = /<input[^>]*id="profile-email"[^>]*>/.exec(markup)?.[0];

    expect(email).toContain("readOnly");
    expect(email).toContain('value="grace@example.com"');
    expect(email).not.toContain('name="');
    expect(markup).toContain("Your email address cannot be changed here.");
  });

  it("labels the name fields and disables Cancel until something changes", async () => {
    const markup = await render();

    expect(markup).toMatch(/<label[^>]*>First name/);
    expect(markup).toMatch(/<label[^>]*>Last name/);
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Cancel<\/button>/);
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Save changes/);
  });

  it("shows a pending save state", async () => {
    state.updatePending = true;
    const markup = await render();
    expect(markup).toContain("Saving…");
    expect(markup).toContain('aria-busy="true"');
  });

  it("falls back to initials and offers upload without removal when there is no photo", async () => {
    const markup = await render();

    expect(markup).toContain(">GH<");
    expect(markup).toContain("Upload new photo");
    expect(markup).toContain('accept="image/*"');
    expect(markup).not.toContain(">Remove<");
  });

  it("shows Remove as unavailable when a photo exists", async () => {
    state.getProfile.mockResolvedValue({
      ...profile,
      avatarUrl: "https://cdn.test/avatar.png",
    });
    const markup = await render();
    const remove = /<button[^>]*>Remove<\/button>/.exec(markup)?.[0];

    expect(markup).toContain('src="https://cdn.test/avatar.png"');
    expect(remove).toContain("disabled");
    expect(remove).toContain('aria-describedby="avatar-remove-unavailable"');
    expect(markup).toContain("Removing a photo is not available yet.");
  });

  it("omits reference fields the backend does not support", async () => {
    const markup = await render();

    for (const unsupported of [
      "Country",
      "Last updated",
      "Connected sign-in",
      "Linked",
      "%",
      "KYC",
      "5 MB",
    ]) {
      expect(markup).not.toContain(unsupported);
    }
    // No success is claimed before a save or upload has completed.
    expect(markup).not.toContain("updated successfully");
    expect(markup).not.toContain("photo was updated");
  });

  it("does not misstate pending account verification", async () => {
    state.getProfile.mockResolvedValue({ ...profile, isVerified: false });
    const markup = await render();
    expect(markup).toContain("Verification pending");
    expect(markup).not.toMatch(/failed|rejected/i);
  });

  it("renders the empty state when the profile has no identity", async () => {
    state.getProfile.mockResolvedValue({
      ...profile,
      emailAddress: "",
      firstName: " ",
      lastName: "",
    });
    const markup = await render();

    expect(markup).toContain("Profile information is unavailable");
    expect(markup).not.toContain("Personal information");
  });
});
