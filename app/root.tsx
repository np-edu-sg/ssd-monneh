import {useState} from "react";
import type {LinksFunction, MetaFunction} from "@remix-run/node";
import type {ColorScheme} from "@mantine/core";
import {ColorSchemeProvider, MantineProvider} from "@mantine/core";
import {Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration} from "@remix-run/react";

import stylesheetUrl from './styles.css'
import {useHotkeys, useLocalStorage} from "@mantine/hooks";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Monneh",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => ([
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: "anonymous"
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,200;0,400;0,600;0,800;1,200;1,400;1,600;1,800&display=swap',
  },
  {
    rel: 'stylesheet',
    href: stylesheetUrl
  }
])

export default function App() {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: 'dark',
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  useHotkeys([['mod+J', () => toggleColorScheme()]]);

  return (
    <html lang="en">
    <head>
      <Meta/>
      <Links/>
    </head>
    <body>

    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider theme={{fontFamily: 'Fira Sans', colorScheme}} withGlobalStyles withNormalizeCSS>
        <Outlet/>
      </MantineProvider>
    </ColorSchemeProvider>

    <ScrollRestoration/>
    <Scripts/>
    <LiveReload/>
    </body>
    </html>
  );
}
