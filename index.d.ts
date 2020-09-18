type UpOptions = { propagate?: boolean, doDefault?: boolean }
type Update = (...data: unknown[]) => unknown
type Up = (handler: Update, data?: unknown, options?: UpOptions) => unknown

// Simulate TemplateResult from lit-html as that lib is not a runtime dep
type TemplateResult = {
  readonly strings: TemplateStringsArray
  readonly values: readonly unknown[]
  readonly type: string
  getHTML: (arg0: string) => string
  getTemplateElement: () => HTMLTemplateElement
}

type Model = unknown
type ViewParams = { model: Model, up: Up }
type View = (params: ViewParams) => TemplateResult

type RenderParams = {
  result: unknown
  container: Element | DocumentFragment
  options?: unknown
}
type Render = (params: RenderParams) => void

type BootstrapParams = {
  model: Model
  up: Up
  url: URL
}
type Boostrap = (params: BootstrapParams) => unknown

type LoggerParams = {
  update: unknown
  data: unknown
  event: Event
  model: Model
  name: string,
  time: Date
  isChained: boolean
}
type Logger = (params: LoggerParams) => void

type AppParams = {
  model?: Model
  view?: View
  render?: Render
  element?: Element | DocumentFragment
  bootstrap?: Boostrap
  logger?: Logger
}

export function app (params: AppParams) : void
