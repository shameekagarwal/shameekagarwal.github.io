import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"
import { Layout } from "../components/layout"
import { List, Typography, Modal, Button } from "antd";

const query = graphql`
  query {
    # add content because root foler also has projects in its path
    allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/(content/projects)/" } }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          order
        }
        html
        excerpt
      }
    }
  }
`

const Projects = ({ location }) => {
  const data = useStaticQuery(query)
  const projects = data.allMarkdownRemark.nodes
      .sort((a, b) => a.order > b.order)

  const [showProjectDetail, setShowProjectDetail] = React.useState(false)
  const [projectIndex, setProjectIndex] = React.useState(-1)

  const closeDetail = () => {
    setShowProjectDetail(false)
    setProjectIndex(-1)
  }

  const openDetail = (projectIndex) => {
    setShowProjectDetail(true)
    setProjectIndex(projectIndex)
  }

  return (
    <Layout title="Projects" path={location.pathname}>
      <List
          size="small"
          dataSource={projects}
          renderItem={(project, index) => (
              <List.Item>
                <List.Item.Meta
                    title={
                      <Typography.Link
                          className="projects--projectTitle"
                          onClick={() => openDetail(index)}
                      >
                        {project.frontmatter.title}
                      </Typography.Link>
                    }
                    description={
                      <div className="projects--projectDescription">{project.excerpt}</div>
                    }
                />
              </List.Item>
          )}
      />
      <Modal
          style={{ top: 20 }}
          width={1000}
          title={projectIndex !== -1 && projects[projectIndex].frontmatter.title}
          visible={showProjectDetail}
          onCancel={closeDetail}
          footer={[
            <Button type="primary" onClick={closeDetail}>
              Close
            </Button>
          ]}
      >
        {
          projectIndex !== -1 &&
          <section className="blog--markdown" dangerouslySetInnerHTML={{ __html: projects[projectIndex].html }}/>
        }
      </Modal>
    </Layout>
  )
}

export default Projects
