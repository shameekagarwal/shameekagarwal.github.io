const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  const blogTemplate = path.resolve(`./src/templates/blog.js`)

  const result = await graphql(
    `
      {
        allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/(blogs)/" } }) {
          nodes {
            id
            fields {
              slug
            }
          }
        }
      }
    `
  )

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blogs`,
      result.errors
    )
    return
  }

  const blogs = result.data.allMarkdownRemark.nodes

  if (blogs.length > 0) {
    blogs.forEach((blog) => {
      console.log(`generating blog for ${blog.fields.slug}`)
      createPage({
        path: blog.fields.slug,
        component: blogTemplate,
        context: {
          id: blog.id,
        },
      })
    })
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })

    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}

exports.onCreateWebpackConfig = (helper) => {
  const { stage, actions, getConfig } = helper
  if (stage === "develop" || stage === "build-javascript") {
    const config = getConfig()
    const miniCssExtractPlugin = config.plugins.find(
      (plugin) => plugin.constructor.name === "MiniCssExtractPlugin"
    )
    if (miniCssExtractPlugin) {
      miniCssExtractPlugin.options.ignoreOrder = true
    }
    actions.replaceWebpackConfig(config)
  }
}
