// Stub window reference to enable lit-html dependency import in node
global.window = {}

// Enable ES6 module loading (cannot use `-r esm` due to substitution of global window object above)
// eslint-disable-next-line no-global-assign
require = require("esm")(module)

// Obtain lit-html equivalent implementation for node-based testing
const { html, renderToString } = require("@popeindustries/lit-html-server")
const document = { body: "" }
const render = async result => { document.body = await renderToString(result) }

// Import module under test and assign node-based rendering implementation
const { app, up, impl } = require("../lit-up")
Object.assign(impl, { html, render })

// Enable "should" style assertions
require("chai").should()

// Utility to create promise of short delay for mocking async operations
const wait = (delay = 100) => new Promise(resolve => setTimeout(resolve, delay))

describe("lit-up", () => {
  describe("basic api", () => {
    it("should have functions called `app` and `up`", () => {
      app.should.be.a("function")
      up.should.be.a("function")
    })
  })

  describe("rendering", () => {
    it("should render a warning if no view supplied", async () => {
      await app()
      document.body.should.equal("No view specified")
    })

    it("should render a simple view with no model", async () => {
      await app({
        view: () => html`Hello, World!`
      })
      document.body.should.equal("Hello, World!")
    })

    it("should render a simple model and view", async () => {
      const model = { name: "Tim" }
      const view = model => html`Hello, ${model.name}!`
      await app({ model, view })
      document.body.should.equal("Hello, Tim!")
    })

    it("should run an async bootstrap provided as a parameter", async () => {
      const model = { loaded: false }
      const updates = {
        async bootstrap () {
          await wait()
          model.loaded = true
        }
      }
      const view = model => html`Loaded: ${model.loaded ? "Yes" : "No"}`
      await app({ model, view, updates })
      document.body.should.equal("Loaded: Yes")
    })

    it("should run an async bootstrap provided as an update key", async () => {
      const model = { loaded: false }
      const bootstrap = async () => {
        model.loaded = true
        return wait()
      }
      const view = model => html`Loaded: ${model.loaded ? "Yes" : "No"}`
      await app({ model, view, updates: { bootstrap } })
      document.body.should.equal("Loaded: Yes")
    })
  })

  describe("updates", () => {
    it("should provide an event handler factory which rerenders the view", async () => {
      const model = { counter: 0 }
      const view = model => html`Count: ${model.counter}`
      const updates = {
        inc () { model.counter++ },
        dec () { model.counter-- }
      }
      await app({ model, view, updates })
      document.body.should.equal("Count: 0")
      await up("inc")()
      document.body.should.equal("Count: 1")
      await up("dec")()
      document.body.should.equal("Count: 0")
    })

    it("should accept update data", async () => {
      const model = { name: "Tim" }
      const view = model => html`Hello, ${model.name}`
      const updates = {
        setName (name) { model.name = name }
      }
      await app({ model, view, updates })
      document.body.should.equal("Hello, Tim")
      await up("setName", "Bob")()
      document.body.should.equal("Hello, Bob")
    })

    it("should accept class as updates parameter", async () => {
      const model = { name: "Tim" }
      const view = model => html`Hello, ${model.name}`

      class Updates {
        constructor (model) {
          this.model = model
        }

        setName (name) {
          this.model.name = name
        }
      }

      const updates = new Updates(model)
      await app({ model, view, updates })
      document.body.should.equal("Hello, Tim")
      await up("setName", "Bob")()
      document.body.should.equal("Hello, Bob")
    })

    it("should include event data", async () => {
      const model = { name: "Tim" }
      const view = model => html`Hello, ${model.name}`
      const updates = {
        setName (data, event) { model.name = event.target.value }
      }
      await app({ model, view, updates })
      document.body.should.equal("Hello, Tim")
      const event = {
        target: { value: "Bob" },
        preventDefault () {}
      }
      await up("setName")(event)
      document.body.should.equal("Hello, Bob")
    })

    it("should provide customisable logging", async () => {
      const model = { text: "" }
      const updates = { setText (text) { model.text = text } }
      const logEntries = []
      const logger = (update, { data }) => {
        logEntries.push(`Update: ${update}, Data: ${data}`)
      }
      await app({ model, updates, logger })
      await up("setText", "first")()
      await up("setText", "second")()
      logEntries.should.have.length(2)
      logEntries[0].should.equal("Update: setText, Data: first")
      logEntries[1].should.equal("Update: setText, Data: second")
    })
  })
})
