import { Badge, Grid, Input, List } from "antd"
import { graphql, Link, useStaticQuery } from "gatsby"
import * as React from "react"
import { Layout } from "../components/layout"

const query = graphql`
  query {
    allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/(blogs)/" } }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          tags
        }
        excerpt
      }
    }
  }
`

const aIncludesB = (a, b) => a.toLowerCase().includes(b.toLowerCase())

const Blogs = ({ location }) => {
  const data = useStaticQuery(query)
  const blogs = data.allMarkdownRemark.nodes
      .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title))
  const [filterText, setFilterText] = React.useState("")
  const [filteredBlogs, setFilteredBlogs] = React.useState(blogs)
  const breakpoint = Grid.useBreakpoint()

  React.useEffect(() => {
    const filterBlogs = () => {
      if (!filterText) {
        setFilteredBlogs(blogs)
      } else {
        const filteredBlogs = blogs.filter((blog) => {
          const titleIncludesText = aIncludesB(
            blog.frontmatter.title,
            filterText
          )

          const tagsIncludeText = (blog.frontmatter.tags || []).reduce(
            (v, tag) => v || aIncludesB(tag, filterText),
            false
          )

          return titleIncludesText || tagsIncludeText
        })
        setFilteredBlogs(filteredBlogs)
      }
    }

    const timeoutId = setTimeout(filterBlogs, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterText])

  return (
    <Layout title="Blogs" path={location.pathname}>
      <Input
        placeholder="filter blogs by title or tags"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="blogs--input"
      />

      <List
        size="small"
        dataSource={filteredBlogs}
        renderItem={(blog) => (
          <List.Item
            actions={(blog.frontmatter.tags || []).map((tag) =>
              breakpoint["lg"] ? <Badge count={tag} /> : null
            )}
          >
            <List.Item.Meta
              title={
                <Link className="blogs--blogTitle" to={blog.fields.slug.slice(0, -1)}>
                  {blog.frontmatter.title}
                </Link>
              }
              description={
                <div className="blogs--blogDescription">{blog.excerpt}</div>
              }
            />
          </List.Item>
        )}
      />
    </Layout>
  )
}

export default Blogs
