import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"

const query = graphql`
  query {
    site {
      siteMetadata {
        utterancesBlogCommentsRepo
      }
    }
  }
`

export const BlogComments = ({ issueTerm }) => {
  const data = useStaticQuery(query)

  const repository = data.site.siteMetadata.utterancesBlogCommentsRepo
  const commentsUUID = `comments_${issueTerm}`

  React.useEffect(() => {
    let anchor
    const theme = "github-light"
    const script = document.createElement("script")
    anchor = document.getElementById(commentsUUID)
    script.setAttribute("src", "https://utteranc.es/client.js")
    script.setAttribute("crossorigin", "anonymous")
    script.setAttribute("async", true)
    script.setAttribute("repo", repository)
    script.setAttribute("issue-term", issueTerm)
    script.setAttribute("theme", theme)
    anchor.appendChild(script)
    return () => (anchor.innerHTML = "")
  })

  return (
    <>
      <div id={commentsUUID} className="post-comments">
        <div className="utterances-frame"></div>
      </div>
    </>
  )
}
