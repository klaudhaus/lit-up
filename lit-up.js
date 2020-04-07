/**
 * `lit-up` is a simple state management pattern for web apps that use `lit-html` templates
 */

/**
 * Initialise an application
 * @param model The main application model
 * @param view The top-level application view function
 * @param render The lit-html render implementation
 * @param element Where to render app - defaults to page body
 * @param bootstrap A function to run on app load to do any necessary model initialisation
 * @param logger { boolean | function } `true` to use console.log, or pass a custom logger function
 * @returns {Function} An factory function which returns event handlers that trigger view updates
 */
export const app = async ({
  model = {},
  view = () => "lit-up: No view specified",
  render,
  element = typeof document === "object" && document.body,
  bootstrap = () => {},
  logger = false
} = {}) => {
  logger = logger === true ? console.log
    : typeof logger === "function" ? logger
      : () => {}

  /**
   * Event handler factory function.
   * Use in templates like `@click=${up(selectItem, item)}`.
   * Use from elsewhere like `up(messageReceived, message)()`.
   * @param update A function which will update the model
   * @param data update-related data
   * @param doDefault If specified as true, default event handling will execute. Defaults to false.
   * @returns {Function} An event handler suitable for use in `lit-html` templates.
   */
  const up = (update, data = {}, { doDefault = false } = {}) => async event => {
    if (event && !doDefault) event.preventDefault()

    const doRender = () => render(view({ up, model }), element)

    let isChained = false
    while (typeof update === "function") {
      const entry = {
        update, data, event, isChained, model,
        name: update.name,
        time: new Date().getTime()
      }
      update = update(data, event)
      logger(entry)
      if (update instanceof Promise) {
        // Handle async updates
        const renderAndWait = await Promise.all([doRender(), update])
        logger({ ...entry, ...{ time: new Date().getTime() } })
        update = renderAndWait[1]
      }
      if (typeof update === "object" && "update" in update) {
        // Allow change of data and/or event within chain
        data = update.data || data
        event = update.event || event
        update = update.update
      }
      isChained = true
    }

    return await doRender()
  }

  await up(bootstrap)()

  return up
}
