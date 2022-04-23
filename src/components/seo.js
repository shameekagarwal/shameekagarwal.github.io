import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"
import { Helmet } from "react-helmet"

const query = graphql`
  query {
    site {
      siteMetadata {
        author {
          name
          summary
        }
        siteUrl
        googleSiteVerificationKey
      }
    }
  }
`

export const Seo = ({ title: propsTitle, path = "/" }) => {
  const data = useStaticQuery(query)

  const authorName = data.site.siteMetadata.author.name
  const authorSummary = data.site.siteMetadata.author.summary
  const siteUrl = data.site.siteMetadata.siteUrl

  const title = propsTitle ? `${authorName} | ${propsTitle}` : authorName
  const description = propsTitle ? propsTitle : authorSummary
  const canonicalLink = new URL(path, siteUrl)

  return (
    <Helmet>
      <title>{title}</title>

      <meta
        name="google-site-verification"
        content={data.site.siteMetadata.googleSiteVerificationKey}
      />

      <link rel="canonical" href={canonicalLink} />
      <meta name="description" content={description} />

      <meta property="og:url" content={canonicalLink} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
