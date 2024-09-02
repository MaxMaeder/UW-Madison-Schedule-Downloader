import type { EmotionCache, MantineProviderProps } from "@mantine/core";
import { MantineProvider } from "@mantine/core";
import type { PropsWithChildren } from "react";

interface ThemeProviderProps extends PropsWithChildren<MantineProviderProps> {
  emotionCache?: EmotionCache;
}

export const ThemeProvider = ({
  emotionCache,
  children,
  ...props
}: ThemeProviderProps) => {
  return (
    <MantineProvider
      emotionCache={emotionCache}
      theme={{
        colorScheme: "dark",
        primaryColor: "red"
      }}
      {...props}>
      {children}
    </MantineProvider>
  );
};
