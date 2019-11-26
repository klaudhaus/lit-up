#!/usr/bin/env node

/**
 * This script is linked from `bin` in the `lit-up` package.json
 * to enable running `lit-up-examples` in any project that uses `lit-up`
 *
 * To see how to launch es-dev-server directly from shell or as an npm script,
 * which will probably be a better fit for developing your app,
 * look at the `examples` script in package.json for `lit-up` module
 */

const { createConfig, startServer } = require("es-dev-server")

const config = createConfig({
  open: "node_modules/@klaudhaus/lit-up/examples/",
  nodeResolve: true
})

startServer(config)
