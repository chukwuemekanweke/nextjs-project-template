import type { Preview } from "@storybook/react-vite";
import "./preview.css";

export type WorkbenchTheme = "light" | "dark";

/** Applies the theme the way next-themes does: a `dark` class on <html>. */
export function applyTheme(theme: WorkbenchTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      applyTheme(context.globals.theme === "dark" ? "dark" : "light");
      // Full-page layouts (the dashboard shell) render edge to edge.
      if (context.parameters.bare) return <Story />;
      return (
        <div className="bg-bg text-fg min-h-screen p-4 md:p-8">
          <Story />
        </div>
      );
    },
  ],
  globalTypes: {
    theme: {
      description: "Colour theme",
      toolbar: {
        dynamicTitle: true,
        icon: "mirror",
        items: [
          { title: "Light", value: "light" },
          { title: "Dark", value: "dark" },
        ],
        title: "Theme",
      },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    a11y: { test: "error" },
    controls: { expanded: true },
    layout: "fullscreen",
    viewport: {
      options: {
        desktop: {
          name: "Desktop (reference 1440)",
          styles: { height: "900px", width: "1440px" },
          type: "desktop",
        },
        phone: {
          name: "Phone (reference 390)",
          styles: { height: "844px", width: "390px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet (834)",
          styles: { height: "1112px", width: "834px" },
          type: "tablet",
        },
      },
    },
  },
};

export default preview;
