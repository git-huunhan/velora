import type { Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "../src/index.css";

type ThemeName = "light" | "dark";

function ThemeDecorator(
  Story: React.ComponentType,
  context: { globals: { theme?: ThemeName } },
) {
  const theme = context.globals.theme ?? "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <Story />
    </div>
  );
}

const preview: Preview = {
  decorators: [ThemeDecorator],
  globalTypes: {
    theme: {
      description: "Preview theme",
      defaultValue: "dark",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  parameters: {
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
};

export default preview;
