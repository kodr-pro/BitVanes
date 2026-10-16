import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'BitVanes',
  description: 'Guided, step-by-step tours through diffs, AI-generated changes, and unfamiliar code — right inside VS Code.',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Demo', link: '/demo' },
      { text: 'Reference', link: '/reference/commands' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Walkthroughs', link: '/guide/walkthroughs' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Commands', link: '/reference/commands' },
          { text: 'Settings', link: '/reference/settings' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/kodr-pro/BitVanes' }],
    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright 2026 kodr-pro',
    },
    outline: { level: [2, 3] },
  },
});
