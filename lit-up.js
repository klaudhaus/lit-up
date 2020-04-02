import { html, render } from "lit-html"

// Convenience, reexport default `html` tag from lit-html
export { html }

// Allow override of lit-html implementation (e.g. for use in tests)
export const impl = { html, render }

// Note: this module currently implements a singleton app pattern,
// and does not support multiple apps on the same page.
// ROADMAP: Support multiple apps per page.
let _model, _view, _element, _logger

/**
 * Initialise an application
 * @param model The main application model
 * @param view The top-level application view function
 * @param element Where to render app - defaults to page body
 * @param bootstrap A function to run on app load to do any necessary model initialisation
 * @param logger { boolean | function } `true` to use console.log, or pass a custom logger function
 */
export const app = async ({
  model = {},
  view = () => impl.html`No view specified`,
  element = typeof document === "object" && document.body,
  bootstrap = () => {},
  logger = false
} = {}) => {
  _model = model
  _view = view
  _element = element
  _logger = logger === true ? console.log : logger

  return await up(bootstrap)()
}

/**
 * Event handler factory function.
 * Use in templates like `@click=${up("selectItem", item)}`.
 * Use from elsewhere like `up("messageReceived", message)()`.
 * @param update A function which will update the model
 * @param data update-related data
 * @param doDefault If specified as true, default event handling will execute. Defaults to false.
 * @returns {Function} An event handler suitable for use in `lit-html` templates.
 */
export const up = (update, data = {}, { doDefault = false }) => async event => {
  // Prevent default event actions (e.g. form submit) unless specifically enabled
  if (event && !doDefault) event.preventDefault()

  // Enable update chaining
  while (typeof update === "function") {
    const entry = {
      update, data, event, // eslint-disable-line object-property-newline
      model: _model,
      name: update.name,
      time: new Date().getTime()
    }
    update = update(data, event)
    log(entry)
    if (update instanceof Promise) {
      const renderAndWait = await Promise.all([doRender(), update])
      update = renderAndWait[1]
      log({ ...entry, ...{ isChained: true } })
    }
  }

  return await doRender()
}

const log = obj => typeof _logger === "function" ? _logger(obj) : undefined

const doRender = () => impl.render(_view(_model), _element)
