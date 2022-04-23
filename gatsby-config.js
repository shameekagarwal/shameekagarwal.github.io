module.exports = {
  siteMetadata: {
    author: {
      name: `Shameek`,
      summary: `A software developer based in India`,
      email: `shameek.agarwal@gmail.com`,
    },
    siteUrl: `https://shameekagarwal.github.io`,
    links: {
      linkedin: `http://www.linkedin.com/in/shameek-agarwal-4b1ab4131`,
      gitlab: `https://gitlab.com/shameekagarwal`,
      github: `https://github.com/shameekagarwal`,
    },
    formSpreeLink: "https://formspree.io/f/xqkwdjyb",
    googleSiteVerificationKey: "xNl1G_m7Q01Eya0WqvxAhhjIuG10aBEDZBwb9BeU2gM",
    utterancesBlogCommentsRepo: "shameekagarwal/shameekagarwal.github.io",
  },

  plugins: [
    `gatsby-plugin-image`,

    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blogs`,
        name: `blogs`,
      },
    },

    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/about`,
        name: `about`,
      },
    },

    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/experience`,
        name: `experience`,
      },
    },

    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/projects`,
        name: `projects`,
      },
    },

    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-autolink-headers`,
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 630,
              wrapperStyle: `margin: 5px 0 5px 0 !important;`,
            },
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              showLineNumbers: true,
            },
          },
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },

    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-react-helmet`,

    {
      resolve: "gatsby-plugin-antd",
      options: {
        style: true,
      },
    },
    {
      resolve: "gatsby-plugin-less",
      options: {
        lessOptions: {
          modifyVars: {
            "@font-family": "'Ubuntu', sans-serif",
            "@font-size-base": "18px",
            "@body-background": "#fbfbfd",
            "@layout-body-background": "#fbfbfd",
            "@layout-header-background": "#fbfbfd",
            "@component-background": "#fbfbfd",
            "@text-color": "#333",
            "@heading-color": "#333",
          },
          javascriptEnabled: true,
        },
      },
    },

    `gatsby-plugin-catch-links`,
    `gatsby-plugin-sitemap`,
  ],
}
