import {
  DownloadOutlined,
  GithubOutlined,
  GitlabOutlined,
  LinkedinOutlined,
} from "@ant-design/icons"
import { Button, Divider, Space, Tooltip, Typography } from "antd"
import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"
import { Layout } from "../components/layout"

const query = graphql`
  query {
    site {
      siteMetadata {
        author {
          name
          summary
        }
        links {
          linkedin
          gitlab
          github
        }
      }
    }

    markdownRemark(fileAbsolutePath: { regex: "/(about/about.md)/" }) {
      html
    }
  }
`

const Index = ({ location }) => {
  const data = useStaticQuery(query)

  const authorName = data.site.siteMetadata.author.name
  const authorSummary = data.site.siteMetadata.author.summary
  const links = data.site.siteMetadata.links
  const about = data.markdownRemark.html

  return (
    <Layout path={location.pathname}>
      <Typography.Title className="about--authorName">
        I am {authorName},
      </Typography.Title>
      <Typography.Text>{authorSummary}.</Typography.Text>

      <div className="about--resumeButtonContainer">
        <a href="/resume.pdf" target="_blank">
          <Button icon={<DownloadOutlined />} type="primary" size="large">
            Download my Resume
          </Button>
        </a>
      </div>

      <Typography.Paragraph>
        <span dangerouslySetInnerHTML={{ __html: about }} />
      </Typography.Paragraph>

      <Divider />

      <Space size={40}>
        <SocialLink
          title="Linkedin"
          icon={LinkedinOutlined}
          href={links.linkedin}
        />
        <SocialLink title="Gitlab" icon={GitlabOutlined} href={links.gitlab} />
        <SocialLink title="Github" icon={GithubOutlined} href={links.github} />
      </Space>
    </Layout>
  )
}

function SocialLink({ title, href, icon }) {
  const Icon = icon

  return (
    <Tooltip title={title}>
      &nbsp;
      <Typography.Link
        className="about--socialLink"
        href={href}
        target="_blank"
      >
        <Icon size={20} />
      </Typography.Link>
    </Tooltip>
  )
}

export default Index
