#!/usr/bin/env node

const { createConfig, startServer } = require("es-dev-server")

const config = createConfig({
  rootDir: "..",
  open: "examples/",
  nodeResolve: true
})

startServer(config)
