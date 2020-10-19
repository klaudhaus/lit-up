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
 * @returns {Function} A factory function which returns event handlers that trigger view updates
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
   * @param doDefault Perform browser default event action. Defaults to false.
   * @param propagate Propagate this event to containing element for further handling. Defaults to false.
   * @returns {Function} An event handler suitable for use in `lit-html` templates.
   */
  const up = (update, data, { doDefault = false, propagate = false } = {}) => async event => {
    if (event) {
      if (!doDefault) event.preventDefault()
      if (!propagate) event.stopPropagation()
    }

    const doUp = async ({ update, data, event, isChained = false }) => {
      const doRender = () => render(view({ up, model }), element)

      // Do update and log
      const entry = {
        name: update ? update.name : "",
        time: new Date(),
        isChained, data, event, update, model
      }
      let result = update ? update(data, event) : false
      await logger(entry)

      // Handle async updates
      if (result instanceof Promise) {
        const renderAndWait = await Promise.all([doRender(), result])
        logger({ ...entry, ...{ time: new Date() } })
        result = renderAndWait[1]
      }

      await doRender()

      // Handle chaining
      const chain = { isChained: true }
      const resultToArgs = update =>
        typeof update === "function" ? { update, data, event, ...chain }
          : typeof update === "object" && "update" in update
            ? { ...{ data, event }, ...update, ...chain }
            : false

      if (Array.isArray(result)) {
        for (const args of result.map(resultToArgs).filter(Boolean)) {
          await doUp(args)
        }
      } else if (["function", "object"].includes(typeof result)) {
        await doUp(resultToArgs(result))
      }
    }

    await doUp({ update, data, event })
  }

  const url = typeof location !== "undefined" &&
    (typeof URL !== "undefined" ? new URL(location) : location)
  await up(bootstrap, { up, model, url })()

  return up
}
