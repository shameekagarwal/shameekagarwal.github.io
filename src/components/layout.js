import { Col, Row } from "antd"
import * as React from "react"
import "../styles/index.less"
import { NavBar } from "./navbar"
import { Seo } from "./seo"

export const Layout = ({ title, path, children }) => {
  return (
    <>
      <Seo title={title} path={path} />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="true"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap"
        rel="stylesheet"
      />

      <NavBar />

      <Row className="container layout--content">
        <Col xs={24}>{children}</Col>
      </Row>
    </>
  )
}
