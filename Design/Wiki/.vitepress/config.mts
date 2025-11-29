import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "BookBoss Wiki",
  description: "Documentation for BookBoss Library Manager",
  base: '/BookBoss/', // Matches repo name 'BookBoss'

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Features', link: '/Features' },
      { text: 'Architecture', link: '/System_Architecture' }
    ],

    sidebar: [
      {
        text: 'Design & Architecture',
        items: [
          { text: 'System Architecture', link: '/System_Architecture' },
          { text: 'Database Design', link: '/Database_Design' },
          { text: 'User Flows', link: '/User_Flows' },
          { text: 'Features Overview', link: '/Features' }
        ]
      },
      {
        text: 'Planning',
        items: [
          { text: 'Planned Features', link: '/Planning/PLANNED_FEATURES' },
          { text: 'Migration Plan', link: '/Planning/react_migration_plan' }
        ]
      },
      {
        text: 'Guide',
        items: [
          { text: 'Documentation Guide', link: '/Documentation_Guide' }
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
