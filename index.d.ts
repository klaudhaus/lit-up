export type UpOptions = { propagate?: boolean, doDefault?: boolean }
export type Update<T> = (data?: T, event?: Event) => UpdateResult<T> | Promise<UpdateResult<T>>
export type ChainedUpdate<T> = Update<T> | { update: Update<T>, data?: T }
export type UpdateResult<T> = ChainedUpdate<T> | Array<ChainedUpdate<T>> | void
export type Up<T> = (handler: Update<T>, data?: T, options?: UpOptions) => (e?: Event) => any

// Simulate types from lit-html as that lib is not a runtime dep
type TemplateResult = {
  readonly strings: TemplateStringsArray
  readonly values: readonly unknown[]
  readonly type: string
  getHTML: (arg0: string) => string
  getTemplateElement: () => HTMLTemplateElement
}
type RenderParams = {
  result: unknown
  container: Element | DocumentFragment
  options?: unknown
}
type Render = (params: RenderParams) => void

export type Model = any
export type ViewParams = { model: Model, up: Up<any> }
export type ViewResultItem = string | TemplateResult
export type ViewResult = ViewResultItem | ViewResultItem[]
export type View = (params: ViewParams) => ViewResult

export type BootstrapParams = {
  model?: Model
  up?: Up<any>
  url?: URL
}
export type Bootstrap = (params: BootstrapParams) => UpdateResult<any>

export type LoggerParams<T> = {
  update?: Update<T>
  data?: T
  event?: Event
  model?: Model
  name?: string
  time?: Date
  isChained?: boolean
}
export type Logger = (params: LoggerParams<any>) => void

export type AppParams = {
  model?: Model
  view?: View
  render?: Render
  element?: Element | DocumentFragment
  bootstrap?: Bootstrap
  logger?: Logger
}

export function app<T> (params: AppParams) : Promise<Up<T>>
