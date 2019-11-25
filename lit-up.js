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
 */
export const app = async ({
  model = {},
  updates = {},
  view = () => impl.html`No view specified`,
  element = typeof document === "object" && document.body,
  bootstrap = updates.bootstrap,
  logger = false
} = {}) => {
  _model = model
  _updates = typeof updates === "function" ? new updates(model) : updates
  _view = view
  _element = element
  _logger = logger === true ? console.log : logger

  if (typeof bootstrap === "function") await bootstrap()

  return await up()()
}

/**
 * Event handler factory function.
 * Use in templates like `@click=up("selectItem", item)`.
 * Use from elsewhere like `up("messageReceived", message)()`.
 * @param update A function or the key of a member of the application updates object.
 * @param data update-related data.
 * @param doDefault If specified as true, default event handling will execute. Defaults to false.
 * @returns {Function} An event handler suitable for use in `lit-html` templates.
 */
export const up = (update, data = {}, doDefault = false) => async event => {
  // Prevent default event actions (e.g. form submit) unless specifically enabled
  if (event && !doDefault) event.preventDefault()

  try{
    // Enable update chaining
    while (update) {
      if (typeof update === "function") {
        // Execute updates provided as functions
        update = await update(data, event)
      } else if (typeof update === "string" && typeof _updates[update] === "function") {
        // Execute updates provided as keys of the updates object
        const handler = dotPath(_updates, update)
        if (typeof handler === "function") {
          if (typeof _logger === "function") _logger(update, data, event, _model)
          update = await _updates[update](data, event)
        }
      } else update = null // Any other type will end the chain
    }
  } catch(error) {
    // Log the update, data and event that caused an error for ease of debugging
    console.log("** Error in update: ", update, "** data: ", data, "** event: ", event)
    throw error
  }

  return await impl.render(_view(_model), _element)
}

const dotPath = (target, path) => {
  const parts = path.split(".")
  while (target && parts.length) {
    target = target[parts.shift()]
  }
  return target
}
