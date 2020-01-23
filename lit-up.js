import { html, render } from "lit-html"

// Convenience, reexport default `html` tag from lit-html
export { html }

// Allow override of lit-html implementation (e.g. for use in tests)
export const impl = { html, render }

// Note: this module currently implements a singleton app pattern,
// and does not support multiple apps on the same page.
// ROADMAP: Support multiple apps per page.
let _model, _updates, _view, _element, _logger

/**
 * Initialise an application
 * @param model The main application model
 * @param updates A collection of application updates, either a constructed object or a class that takes model as constructor parameter
 * @param view The top-level application view function
 * @param element Where to render app - defaults to page body
 * @param bootstrap Function to run on app load, defaults to updates.bootstrap if present
 * @param logger { boolean | function } `true` to use console.log, or pass a custom logger function
 */
export const app = async ({
  model = {},
  updates = {},
  view = () => impl.html`No view specified`,
  element = typeof document === "object" && document.body,
  logger = false
} = {}) => {
  _model = model
  _updates = typeof updates === "function" ? new updates(model) : updates
  _view = view
  _element = element
  _logger = logger === true ? console.log : logger

  return await up("bootstrap")()
}

/**
 * Event handler factory function.
 * Use in templates like `@click=${up("selectItem", item)}`.
 * Use from elsewhere like `up("messageReceived", message)()`.
 * @param update A function or the key of a member of the application updates object.
 * @param data update-related data.
 * @param doDefault If specified as true, default event handling will execute. Defaults to false.
 * @returns {Function} An event handler suitable for use in `lit-html` templates.
 */
export const up = (update, data = {}, doDefault = false) => async event => {
  // Prevent default event actions (e.g. form submit) unless specifically enabled
  if (event && !doDefault) event.preventDefault()

  // Enable update chaining, with locally mutated update key to preserve original value in long-liced handlers
  let doUpdate = update
  while (doUpdate) {
    const key = typeof doUpdate === "string" ? doUpdate : "anon" // Default update key for logging non-string calls
    if (typeof doUpdate === "string") {
      // Resolve update key within updates object
      doUpdate = dotPath(_updates, doUpdate)
    }
    if (typeof doUpdate === "function") {
      if (typeof _logger === "function") _logger(key, { data, event, model: _model })
      doUpdate = doUpdate.call(_updates, data, event)
      if (doUpdate instanceof Promise) {
        const renderAndWait = await Promise.all([doRender(), doUpdate])
        doUpdate = renderAndWait[1]
      }
    } else doUpdate = null // Any other type will end the chain
  }

  return await doRender()
}

const dotPath = (target, path) => {
  const parts = path.split(".")
  while (target && parts.length) target = target[parts.shift()]
  return target
}

const doRender = () => impl.render(_view(_model), _element)
