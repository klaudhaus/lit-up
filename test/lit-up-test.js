// Enable ES6 module loading
// eslint-disable-next-line no-global-assign
require = require("esm")(module)

// Obtain lit-html equivalent render for node-based testing
const { html, renderToString } = require("@popeindustries/lit-html-server")
const document = { body: "" }
const render = async result => { document.body = await renderToString(result) }
const { app } = require("../lit-up")

// Enable "should" style assertions
require("chai").should()

// Utility to create promise of short delay for mocking async operations
const wait = (delay = 100) => new Promise(resolve => setTimeout(resolve, delay))

describe("lit-up", () => {
  describe("basic api", () => {
    it("should have a function called `app`", () => {
      app.should.be.a("function")
    })
  })

  describe("rendering", () => {
    it("should render a warning if no view supplied", async () => {
      await app({ render })
      document.body.should.equal("lit-up: No view specified")
    })

    it("should render a simple view with no model", async () => {
      await app({
        view: () => html`Hello, World!`,
        render
      })
      document.body.should.equal("Hello, World!")
    })

    it("should render a simple model and view", async () => {
      const model = { name: "Tim" }
      const view = ({ model }) => html`Hello, ${model.name}!`
      await app({ model, view, render })
      document.body.should.equal("Hello, Tim!")
    })

    it("should run an async bootstrap provided as a parameter", async () => {
      const model = { loaded: false }
      const bootstrap = async () => {
        await wait()
        model.loaded = true
      }

      const view = ({ model }) => html`Loaded: ${model.loaded ? "Yes" : "No"}`
      await app({ model, view, render, bootstrap })
      document.body.should.equal("Loaded: Yes")
    })
  })

  describe("updates", () => {
    it("should provide an event handler factory which rerenders the view", async () => {
      const model = { counter: 0 }
      const view = ({ model }) => html`Count: ${model.counter}`
      const inc = () => { model.counter++ }
      const dec = () => { model.counter-- }
      const up = await app({ model, view, render })
      document.body.should.equal("Count: 0")
      await up(inc)()
      document.body.should.equal("Count: 1")
      await up(dec)()
      document.body.should.equal("Count: 0")
    })

    it("should accept update data", async () => {
      const model = { name: "Tim" }
      const view = ({ model }) => html`Hello, ${model.name}`
      const setName = name => { model.name = name }
      const up = await app({ model, view, render })
      document.body.should.equal("Hello, Tim")
      await up(setName, "Bob")()
      document.body.should.equal("Hello, Bob")
    })

    it("should include event data", async () => {
      const model = { name: "Tim" }
      const view = ({ model }) => html`Hello, ${model.name}`
      const setName = (data, event) => { model.name = event.target.value }
      const up = await app({ model, view, render })
      document.body.should.equal("Hello, Tim")
      const event = {
        target: { value: "Bob" },
        preventDefault () {},
        stopPropagation () {}
      }
      await up(setName)(event)
      document.body.should.equal("Hello, Bob")
    })

    it("should provide customisable logging", async () => {
      const model = { text: "" }
      const setText = (text) => { model.text = text }
      const logEntries = []
      const logger = ({ name, data }) => {
        logEntries.push(`Update name: ${name}, Data: ${data}`)
      }
      const view = () => html``
      const up = await app({ model, view, render, logger })
      await up(setText, "first")()
      await up(setText, "second")()
      logEntries.should.have.length(3)
      logEntries[1].should.equal("Update name: setText, Data: first")
      logEntries[2].should.equal("Update name: setText, Data: second")
    })
  })
})
