import { Col, Divider, Typography } from "antd"
import { graphql } from "gatsby"
import * as React from "react"
import { BlogComments } from "../components/blog-comments"
import { Layout } from "../components/layout"

export const pageQuery = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      fields {
        slug
      }
      id
      html
      frontmatter {
        title
      }
    }
  }
`

const Blog = ({ data, location }) => {
  const blog = data.markdownRemark

  return (
    <Layout title={blog.frontmatter.title} path={location.pathname}>
      <Typography.Title className="blog--title" level={1}>
        {blog.frontmatter.title}
      </Typography.Title>

      <section
        className="blog--markdown"
        dangerouslySetInnerHTML={{ __html: blog.html }}
      />

      <Divider />

      {location.hostname !== "localhost" ? (
        <Col xs={24}>
          <BlogComments issueTerm={blog.fields.slug} />
        </Col>
      ) : null}
    </Layout>
  )
}

export default Blog

/* 
to add support for anchor https://ant.design/components/anchor/

1. add the following to the query

markdownRemark {
  # ...

  headings {
    depth
    value
    id
  }
}

2. const headings = blog.headings.filter((heading) => heading.depth === 1)

3. 

<Anchor affix={true} offsetTop={50}>
  {headings.map((heading) => (
    <Anchor.Link
      key={heading.id}
      href={`#${heading.id}`}
      title={heading.value}
    />
</Anchor>

*/
