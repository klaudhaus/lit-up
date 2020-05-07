
![lit-up logo](./doc/lit-up-logo.jpg)

# lit-up

>  Minimal yet scalable state pattern for interactive web apps with [`lit-html`](https://lit-html.polymer-project.org/) templates

### Features

* Fast and lightweight (`lit-up` + `lit-html` < 4kB minified)
* Best practice one-way reactive data flow architecture
* Handles synchronous and asynchronous updates
* Well-defined render points for async
* Update chaining
* Pluggable logging

### Quick Start

The easiest way to set up `lit-up` is via [`lit-app`](https://github.com/klaudhaus/lit-app).

But here we show you how you can initialise `lit-up` independently. These are the basic steps to make a `lit-up` application in a file called `index.js`.

* Import modules. You can use the CDN links shown below or [install locally](#installation).

```js
import { html, render } from "https://cdn.pika.dev/lit-html"
import { app } from "https://cdn.pika.dev/lit-up"
```

* Declare an initial state for an application `model`.

```js
const model = {
  name: "World",
  dice: {
    score: 0
  }
}
```

* Make functions for any model updates.

```js
const roll = dice => {
  dice.score = Math.ceil(Math.random() * 6)
}
```

* Create a `view` function that displays the `model` and uses  `up` to link user actions to your update functions.

```js
const view = ({ model, up }) => html`
  <p>Hello, ${model.name}</p>
  <button @click=${up(roll, model.dice)}> 
    Roll the Dice
  </button>
  <p>Score: ${model.dice.score || "Ready"}</p>`
```

* Pass `view` and `model` (along with the `render`  method from `lit-html`) to bootstrap the `app`.

```js
app ({ view, model, render })
```

Then load `index.js` as a module in a HTML page.

```html
<script src="index.js" type="module" />
```

And you have an interactive web app.

### Installation

You can use the CDN links shown in the Quick Start, or install the modules locally:

```bash
npm install lit-html lit-up
```

We suggest using `es-dev-server` to provide automatic ES6 module resolution using the NodeJS algorithm during development.

```bash
npm install --save-dev es-dev-server
es-dev-server --open --watch --node-resolve 
```

`es-dev-server` will open your app's page, reload it whenever you make changes and link "naked imports" like those below to the appropriate location within `node_modules`.

```js
import { html, render } from "lit-html"
import { app } from "lit-up"
```

For production, you should bundle the application code along with dependencies using a tool like `rollup`.

### Sample App

There is a small sample app in the `examples` folder of this repository. Once you have installed `lit-up` locally in your project, you can run the sample app using the following command.

```bash
lit-up-examples
```



## API

### `app(options)`

The `app` method bootstraps an app with its specified configuration options, which can include:

* `model`

A reference to the application state model object that will be provided to the view function on each update. If not specified, defaults to an empty object.

* `view`

A function that takes the keys `model`  and `up` and returns a view representation of that model as a `lit-html` template result with events handled via `up`. If not specified defaults to a view function that displays the text "No view specified".

* `render`

The `render` method from `lit-html` or an equivalent implementation. This is required, otherwise no rendering can take place. For headless tests, server-side rendering etc. a static renderer such as `@popeindustries/lit-html-server` can be specified. See `lit-up-test.js` within this repository for an example.

* `bootstrap`

An initial update function that will be called before the first view render. It receives a data object in the form `{ up, model, url }`, where `up` is the application's update event handler, `model` is the same object passed to `app` and `url` is a URL object containing the page location. As per normal updates, if bootstrap is an async function the view will be rendered both before the first `await` and upon function completion. See [Asynchronous Updates](####asynchronous-updates) for more information.

* `logger`

This can be a function with the signature `({update, data, event, model, name, time, isChained})` that receives details of each update, or the boolean value `true` to use `console.log` as the logger function. If not supplied, logging is off by default.

* `element`

The location to render the app. If not specified, defaults to `document.body`. 

The `app` function returns a reference to the app's `up` function, which is also passed to the `bootstrap` function, and to the main `view` fuction on each render. You can initialise multiple apps on a page as needed by passing a different target `element` to each. Each app's `up` function will trigger re-rendering of just that app's view.

For more information on patterns to access `up` see [Application Structure](##application-structure)



### `up(update, data, options)`

The `up` function prepares an event handler which will call the given `update` function with the given `data` value and rerender the app's view.

By default, the `up` handler limits event processing to the provided `update` function and any resulting update chain, but this behaviour can be changed using properties on the  `options` object.

* `doDefault` if set to `true` then any default browser action for the DOM event (such as submitting a form) is also performed. Default is `false`.
* `propagate` if set to `true` then the event will continue to propagate to parent containers and trigger their event handlers. Default is `false`.

#### Update functions

The update functions provided to `up` can accept up to two parameters.

`update(data, event)`

The first is the value of `data` that was also provided to `up`, and can be used to provide application model references from the view, such as the item to delete in the following example.

```js
function deleteItem ({ items, item }) {
  items.splice(items.indexOf(item), 1)
}
  
const itemListView = ({ items, up }) => html`
  <ul>${items.map(item => html`
    <li>${item.name}
      <button @click=${up(deleteItem, { items, item })}> X </button>
    </li>
  </ul>`      
```

The second parameter is the `event` object that triggered the update, as shown below in this function that reads the value from a text input.

```js
function setName (person, event) {
  person.name = event.currentTarget.value
}

const editPerson = ({ person, up }) => html`
  <input value=${person.name} @change=${up(setName, person)} />
  <p> Name: ${person.name} </p>`
```

It is best if update functions provided to `up` have meaningful names as these will be available to any connected logger.

#### Asynchronous updates

If the update is an `async` function, or any function that returns a Promise, then `lit-up` will re-render the view on both the synchronous return of the promise as well as when the promise is finally resolved. In general for an `async` function, this means before the first `await` and also at the conclusion of the entire function. This enables orchestration of view states before and after the completion of an async operation.

```js
async function loadArticleContent (article) {
  article.status = "Loading content..." 
  // New status message is rendered prior to first await
  const response = await fetch(article.contentUrl)
  article.content = await response.text()
  article.status = "Ready"
  // Render again with content and new status
}
```

If you need to orchestrate a more complex sequence of updates you can use chained updates.

#### Chained Updates

If an update function returns another function, or the promise of another function, then that function is processed as a new update, and the original `data` and `event` values are passed along the chain. This can be used for example to orchestrate chains of multiple asynchronous updates, possibly with conditional logic. 

```js
async function loadArticleHeadline (article) {
  article.status = "Loading headline..." // Render before await
  article.headline = await headlineService.fetch(article.id)
  if (article.featured) {
    return loadArticleContent // Perform the next update in the chain
  } else {
    article.status = "Ready" // No further updates
  }
}
```

Alternatively, the next update may be returned as an object with the keys `update`, `data` and `event` to allow different update data to be passed along.

```js
async function nextArticle ({ articles, id }) {
  articles.push({ status: "Loading next article..." })
  const article = await articleService.fetch(id)
  articles.pop()
  articles.push(article)
  return { update: loadArticleHeadline, data: article }
}
```

A sequence of several subsequent updates can be specified via an array of functions or `{update, data, event}` objects. In the following example, the `stageOne` update will be called with `someData`, the `wait` update will cause a half-second delay, and the `stageTwo` update will be called with `innerValue` as its data argument.

```js
const wait = duration => new Promise(resolve => setTimeout(resolve, duration))

const playAnimation = someData => [
  stageOne,
  { update: wait, data: 500 },
  { update: stageTwo, data: someData.innerValue }
]
```

The rendering point rules hold true for all chained updates, so in the above example the view would be rerendered by the `wait` update both immediately and on completion of 500 milliseconds. If you need multiple asynchronous operations without rerendering, call them within the function body of a single update rather than as a return value.

Any connected logger will receive the key `isChained` for an update that was triggered as part of a chain.

#### Calling `up` from JS

`up` is designed firstly for convenience in `lit-html` view event handling. To trigger an update directly in other JavaScript, remember to add a further set of parentheses to call the event handler that `up` returns.

```js
dataService.subscribe(data => {
  up(dataReceived, data)()
})

window.onresize = () => {
  up(winResized)()
}
```

In cases where no additional processing is required outside the update , you can attach the `up` event handler directly.

```js
window.onresize = up(winResized)
```



## Application Structure

Each application initialised with `lit-up` has its own `up` handler for user events. The easiest way to access this is using the [`lit-app`](https://github.com/klaudhaus/lit-app) module, which bundles `lit-up` state management along with isomorphic view support. But if you're using `lit-up` directly, there are various ways of obtaining a reference to `up`.

### Accessing `up`

There are three ways to access the `up` function - via the promised return value of `app`, or as a key provided to both the `view` and `bootstrap` functions.

##### Return from `app`

The return value of `app` is a promise of its related `up` function. This can be useful in some circumstances, but means awaiting the return of the initial render promise, so should not be relied on for view components that need a reference to `up` during initial render.

```js
app({ model, view, render }).then(up => window.onresize = up(winResized))
```

##### Argument to `view`

The `up` function is provided to `view` on each render. This can be used for simple apps with a single view function, or for more complex apps with views split across different functions where the `up` function can be passed onwards as necessary.

```js
import { component } from "./component"

const view = ({ model, up }) => html`
  <h1>Title</h1>
  ${component(up, model.value)}`

app({ model, view, render })
```

```js
\\ component.js
export const component = (up, value) => html`
  <h2>${value}</h2>
  <button @click=${up(someUpdate)}>Click Me</button>`
```

More flexibly, the component could accept an argument that is a prepared event handler. It is then independent of how `up` is accessed in the broader application.

```js
\\ myApp.js
import { component } from "./component"

const view = ({ model, up }) => html`
  <h1>Title</h1>
  ${component({ value: model.value, click: up(someUpdate) })}`

app({ model, view, render })
```

```js
\\ component.js
export const component = ({ value, click }) => html`
  <h2>${value}</h2>
  <button @click=${click}>Click Me</button>`
```

##### Argument to `bootstrap`

The `bootstrap` function receives `up` as an argument and can make it available prior to the initial render. This can seem more convenient than passing references to `up` around in the view, but the question arises how to publish `up` for consumption by view fragments. If exposed on the app module itself, components that import it will be coupled tightly to the app and not be reusable. Assigning to the global `window` object could lead to conflicts or leaks with other page code.

In order to resolve this problem - as well as produce components that can be used agnostically with other `lit-html` compatbile implementations - check out the [`lit-app`](https://github.com/klaudhaus/lit-imp) package. This wraps any provided bootstrap function to get access to `up` and export it as part of the application context.

