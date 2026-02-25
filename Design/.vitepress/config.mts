import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "BookBoss Wiki",
  description: "Documentation for BookBoss Library Manager",
  base: '/BookBoss/', // Matches repo name 'BookBoss'
  ignoreDeadLinks: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'User Guide', link: '/User-Wiki/1-Getting-Started' },
      { text: 'Features', link: '/Design-Wiki/Features' },
      { text: 'Architecture', link: '/Design-Wiki/System_Architecture' },
      {
        text: 'Sponsor',
        items: [
          { text: 'Patreon', link: 'https://www.patreon.com/cw/durfy' },
          { text: 'Ko-fi', link: 'https://ko-fi.com/durfy' },
          { text: 'Buy Me a Coffee', link: 'https://buymeacoffee.com/durf' }
        ]
      }
    ],

    sidebar: [
      {
        text: 'User Guide',
        items: [
          { text: 'Getting Started', link: '/User-Wiki/1-Getting-Started' },
          { text: 'Basic Features', link: '/User-Wiki/2-Basic-Features' },
          { text: 'Advanced Features', link: '/User-Wiki/3-Advanced-Features' }
        ]
      },
      {
        text: 'Design & Architecture',
        items: [
          { text: 'System Architecture', link: '/Design-Wiki/System_Architecture' },
          { text: 'Database Design', link: '/Design-Wiki/Database_Design' },
          { text: 'User Flows', link: '/Design-Wiki/User_Flows' },
          { text: 'Features Overview', link: '/Design-Wiki/Features' }
        ]
      },
      {
        text: 'Planning',
        items: [
          { text: 'Planned Features', link: '/Design-Wiki/Planning/PLANNED_FEATURES' },
          { text: 'Migration Plan', link: '/Design-Wiki/Planning/react_migration_plan' }
        ]
      },
      {
        text: 'Documentation Guide',
        items: [
          { text: 'Documentation Rules', link: '/Design-Wiki/Documentation_Guide' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' } // Placeholder
    ]
  },

  mermaid: {
    // mermaid config
  }
}))
