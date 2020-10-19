type UpOptions = { propagate?: boolean, doDefault?: boolean }
type Update<T> = (data?: T, event?: Event) => UpdateResult<T>
type ChainedUpdate<T> = Update<T> | { update: Update<T>, data: T }
type UpdateResult<T> = ChainedUpdate<T> | Array<ChainedUpdate<T>> | void
type Up<T> = (handler: Update<T>, data?: T, options?: UpOptions) => unknown

// Simulate TemplateResult from lit-html as that lib is not a runtime dep
type TemplateResult = {
  readonly strings: TemplateStringsArray
  readonly values: readonly unknown[]
  readonly type: string
  getHTML: (arg0: string) => string
  getTemplateElement: () => HTMLTemplateElement
}

type Model = unknown
type ViewParams = { model: Model, up: Up<any> }
type View = (params: ViewParams) => TemplateResult

type RenderParams = {
  result: unknown
  container: Element | DocumentFragment
  options?: unknown
}
type Render = (params: RenderParams) => void

type BootstrapParams = {
  model: Model
  up: Up<any>
  url: URL
}
type Boostrap = (params: BootstrapParams) => unknown

type LoggerParams = {
  update: unknown
  data: unknown
  event: Event
  model: Model
  name: string
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

export function app<T> (params: AppParams) : Promise<Up<T>>
