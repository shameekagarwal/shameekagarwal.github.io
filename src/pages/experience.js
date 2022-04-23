import { Steps } from "antd"
import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"
import { Layout } from "../components/layout"

const query = graphql`
  query {
    allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/(experience)/" } }
      sort: { fields: frontmatter___order, order: DESC }
    ) {
      nodes {
        frontmatter {
          company
          position
        }
        id
        html
      }
    }
  }
`

const Experience = ({ location }) => {
  const data = useStaticQuery(query)

  const experiences = data.allMarkdownRemark.nodes

  return (
    <Layout title="Experience" path={location.pathname}>
      <Steps progressDot direction="vertical" current={experiences.length}>
        {experiences.map((experience) => (
          <Steps.Step
            key={experience.id}
            title={<b>{experience.frontmatter.company}</b>}
            subTitle={experience.frontmatter.position}
            description={
              <div
                className="experience--description"
                dangerouslySetInnerHTML={{ __html: experience.html }}
              />
            }
          />
        ))}
      </Steps>
    </Layout>
  )
}

export default Experience
