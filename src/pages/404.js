import { Typography } from "antd"
import * as React from "react"
import { Layout } from "../components/layout"

const _404 = () => {
  const siteTitle = "404"

  return (
    <Layout title={siteTitle} path={siteTitle}>
      <Typography.Title className="_404--title">404</Typography.Title>
      <Typography.Paragraph level={1}>
        Sorry, the page you requested for wasn't found...
      </Typography.Paragraph>
    </Layout>
  )
}

export default _404
