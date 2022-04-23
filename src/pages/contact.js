import { Button, Divider, Form, Input, message, Typography } from "antd"
import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"
import { Layout } from "../components/layout"
import { contactFormRules } from "../extras/contact-form-rules"

const query = graphql`
  query {
    site {
      siteMetadata {
        author {
          email
        }
        formSpreeLink
      }
    }
  }
`

const Contact = ({ location }) => {
  const data = useStaticQuery(query)
  const [form] = Form.useForm()

  const email = data.site.siteMetadata.author.email
  const formSpreeLink = data.site.siteMetadata.formSpreeLink

  const onSubmit = async (values) => {
    await fetch(formSpreeLink, {
      method: "POST",
      body: JSON.stringify(values),
      headers: { Accept: "application/json" },
    })

    form.resetFields()
    message.success("I will get back to you as soon as I can!")
  }

  return (
    <Layout title="Contact" path={location.pathname}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="name"
          rules={contactFormRules.name}
          className="contact--input"
        >
          <Input placeholder="Name" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={contactFormRules.email}
          className="contact--input"
        >
          <Input type="email" placeholder="Email Address" />
        </Form.Item>

        <Form.Item
          name="message"
          rules={contactFormRules.message}
          className="contact--input"
        >
          <Input.TextArea
            minLength={5}
            rows={4}
            placeholder="Your message for me..."
          />
        </Form.Item>

        <Form.Item className="contact--button">
          <Button htmlType="submit" type="primary">
            Reach Me Out
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      <Typography.Paragraph>
        You can also mail me at&nbsp;&nbsp;
        <b>
          <Typography.Link target="_blank" href={`mailto:${email}`}>
            {email}
          </Typography.Link>
        </b>
      </Typography.Paragraph>
    </Layout>
  )
}

export default Contact
