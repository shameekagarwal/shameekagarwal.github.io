import { CloseOutlined, MenuOutlined } from "@ant-design/icons"
import { useLocation } from "@reach/router"
import { Button, Col, Divider, Drawer, Menu, Row } from "antd"
import { Link } from "gatsby"
import * as React from "react"

const topBarLinks = [
  { path: "/contact", text: "Contact" },
  { path: "/blogs", text: "Blogs" },
  { path: "/projects", text: "Projects" },
  { path: "/experience", text: "Experience" },
  { path: "/", text: "About" },
]

const sideBarLinks = topBarLinks.slice().reverse()

const convertToNavBarPath = (path) => {
  if (path === "" || path === "/") {
    return "/"
  }
  return path.endsWith("/") ? path.slice(0, path.length - 1) : path
}

export const NavBar = () => {
  const location = useLocation()
  const [sideBarOpen, setSideBarOpen] = React.useState(false)

  const currentPath = convertToNavBarPath(location.pathname)

  return (
    <Row className="container navbar--navBar">
      <Col xs={0} lg={24}>
        <Menu
          className="navbar--topBar"
          selectedKeys={[currentPath]}
          mode="horizontal"
          disabledOverflow
        >
          {topBarLinks.map((link) => (
            <Menu.Item className="navbar--topBarLink" key={link.path}>
              <Link to={link.path}>{link.text}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Col>

      <Col xs={24} lg={0}>
        <Button onClick={() => setSideBarOpen(true)} icon={<MenuOutlined />} />
      </Col>

      <Drawer
        closeIcon={<CloseOutlined />}
        title="&nbsp;"
        width="275"
        placement="left"
        onClose={() => setSideBarOpen(false)}
        visible={sideBarOpen}
      >
        <Menu selectedKeys={[currentPath]} mode="inline">
          {sideBarLinks.map((link) => (
            <Menu.Item key={link.path} className="navbar--sideBarLink">
              <Link to={link.path}>{link.text}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Drawer>

      <Divider className="navbar--divider" />
    </Row>
  )
}
