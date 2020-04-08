# lit-up

> Build web apps the light way

`lit-up` is a minimal yet scalable state pattern for front-end web apps that use `lit-html` templates.

### Features

* Lightweight (`lit-up` + `lit-html` < 4kB minified)
* Fast (TODO: Benchmarks)
* Develop with ES6 modules and no transpiling
* `lit-html` templates - real HTML, real JS
* Best practice one-way data flow architecture
* Handles synchronous and asynchronous updates
* Well-defined render points for async
* Update chaining
* Pluggable logging
* Works great with web components
* .. and without, using fragment functions
* Scales to large, modular apps
* Online Guides and Articles

### Quick Start

Import modules. You can use the CDN links shown below or [install locally](#Installation).

```js
import { render, html } from
  "https://cdn.pika.dev/lit-html"
import { app } from
  "https://cdn.pika.dev/@klaudhaus/lit-up"
```

Declare an initial state for an application `model`.

```js
const model = {
  name: "World",
  dice: { 
    score: 0 
  }
}
```

Provide functions for model updates.

```js
const roll = dice =>
  dice.score = Math.ceil(Math.random() * 6)
```

Create a `view` function that displays the `model` and uses  `up` to link events to your update functions.

```js
const view = ({ model, up }) => html`
  <p>Hello, ${model.name}</p>
  <button @click=${up(roll, model.dice)}> 
    Roll the Dice
  </button>
	<p>Score: ${model.dice.score || "Ready"}</p>`
```

Use `view` and `model` (along with the `render`  method from `lit-html`) to bootstrap the app.

```js
app ({ view, model, render })
```

Add it as a module to a page.

```html
<script src="index.js" type="module" />
```

And you have an interactive web app.

### Installation

You can use the CDN links shown in the Quick Start, or install the modules locally:

```bash
npm install lit-html @klaudhaus/lit-up
```

We suggest using `es-dev-server` to provide automatic ES6 module resolution using the NodeJS algorithm during development.

```bash
npm install --save-dev es-dev-server
es-dev-server --open --watch --node-resolve 
```

`es-dev-server` will open your project's index.html page on http://localhost:8080, will reload it whenever you make changes and will link "naked imports" like those below to the appropriate location within `node_modules`.

```js
import { html, render } from "lit-html"
import { app } from "@klaudhaush/lit-up"
```

For production, you should bundle the application code along with dependencies using a tool like `rollup`.

For a deeper dive into installation, module resolution, development flows and production builds setup see the [Online Guides](https://klaudhaus.com/lit-up/guides).

## API

### `app(options)`

The `app` method bootstraps an app with its specified configuration options, which can include:

* `model`

A reference to the model object that will be provided to the view function on each update. If not specified, defaults to an empty object.

* `view`

A function that takes the keys `model`  and `up` and returns a view representation of that model as a `lit-html` template result with events handled via `up`. If not specified defaults to a view function that returns the text "No view specified".

* `render`

The `render` method from `lit-html` or an equivalent implementation. This is required, otherwise no rendering can take place. For tests, server-side rendering etc. a static renderer can be specified - see `lit-up-test.js` within this repository for an example.  

* `bootstrap`

An initial update function that will be called with no data or event payload. As per normal updates, if bootstrap is an async function the view will be rendered on both the synchronous return of the promise itself (or before the first `await` in an `async` function) and upon promise resolution (or async function completion) - see [Asynchronous Updates](####Asynchronous Updates) for more information.

* `log`

This can be a function with the signature `({update, data, event, model, name, time, isChained})` that receives details of each update, or the boolean value `true` to use `console.log` as the logger function. If not supplied, logging is off by default.

* `element`

The location to render the app. If not specified, defaults to `document.body`. 

The `app` function returns a reference to the app's `up` function, which is also passed to the main `view` fuction on each render. You can initialise multiple apps on a page as needed, by passing a different target `element` to each. Each app's `up` function will trigger re-rendering of just that app's view.

For more information on patterns to access `up` see [Application Structure](##Application Structure)



### `up(update, data, options)`

The `up` function prepares an event handler which will call the given `update` with the given `data` and rerender the app's view.

The `options` object currently has one option:

* `doDefault` if set to `true` then the browser default action is also performed (such as submitting a form). Default is `false`.

#### Update functions

The update functions provided to `up` can accept up to two parameters.

`update(data, event)`

The first is the value of `data` that was also provided to `up`, and can be used to provide application model references from the view, such as the item to delete in the following example.

```js
const deleteItem = ({ items, item }) =>
	items.splice(items.indexOf(item))
	
const itemListView = ({ items, up }) => html`
  <ul>${items.map(item => html`
    <li>${item.name}
    	<button @click=${up(deleteItem, { items, item })}> X </button>
    </li>
  </ul>` 
```

The second parameter is the `event` object that triggered the update, as shown below in the function that reads the value from a text input.

```js
const setName = (person, event) =>
	person.name = event.currentTarget.value

const editPerson = ({ person, up }) => html`
  <input value=${person.name} @change=${up(setName, person)} />
  <p> Name: ${person.name} </p>`
```

It is best if update functions provided to `up` have meaningful names as these will be available to any connected logger.

#### Asynchronous updates

If the update is an `async` function, or any function that returns a Promise, then `lit-up` will re-render the view on both the synchronous return of the promise as well as when the promise is finally resolved. In general for an `async` function, this means before the first `await` and also at the conclusion of the entire function. This enables orchestration of view states before and after the completion of an async operation.

```js
const loadArticleContent = async article =>
	article.status = "Loading content..." 
	// view will be rendered (with new status message) prior to first async call
  const response = await fetch(article.contentUrl)
  article.content = await response.text()
	article.status = "Loaded"
	// view is rendered again

```

If you need to orchestrate a more complex sequence of updates you can use chained updates or call `up` directly.

#### Chained Updates

If an update function returns another function, or the promise of another function, then that function is processed as a new update, and the original `data` and `event` values are passed along the chain. This can be used for example to orchestrate chains of multiple asynchronous updates, possibly with conditional logic. 

```js
const loadArticleHeadline = async article =>
	article.status = "Loading headline..."
	article.headline = await headlineService.fetch(article.id)
	if (article.featured) {
  	return loadArticleContent  
  }
```

Alternatively, the next update may be returned as an object with the keys `update`, `data` and `event` to allow different update data to be passed along.

```js
const nextArticle = async articles, id =>
  articles.push({ status: "Loading next article..." })
  const article = await articleService.fetch(id)
  articles.pop()
  articles.push(article)
  return { update: loadArticleHeadline, data: article }
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

window.onresize = event => {
  up(winResized, event)()
}
```

However, in cases like above where the update functions can receive the original parameters, you can attach the `up` event handler directly.

```js
dataService.subscribe(up(dataReceived))
window.onResize = up(winResized)
```



## Application Structure

### Accessing `up`

There are two ways to access the `up` function - via the return value of `app` or as a key provided to `view`.

The *return value* of `app` is its related `up` function. It is thus possible to re-export this reference to `up` from your main bootstrapping module for access throughout the app. This can be useful in some situations, however it does tie other app modules specifically to this app, hindering reuse across different apps.

```js
\\ myApp.js
import { component } from "./component"

const view = ({ model }) => html`
  <h1>Title</h1>
  ${component(model.value)}`

export const up = app({ model, view, render })
```

```js
\\ component.js
import { up } from "./myApp"

export const component = value => html`
	<h2>${value}</h2>
  <button @click=${up(someUpdate)}>Click Me</button>
```

The other alternative is to pass `up` through the application view functions as needed. This produces components that are more reusable and removes circular dependencies.

```js
\\ myApp.js
import { component } from "./component"

const view = ({ model, up }) => html`
  <h1>Title</h1>
  ${component(up, value)}`

app({ model, view, render })
```

```js
\\ component.js
export const component = (up, value) => html`
	<h2>${value}</h2>
  <button @click=${up(someUpdate)}>Click Me</button>
```

See [Fragment Functions](###Using Fragment Functions) for an example where a component accepts event handlers that are pre-wrapped with `up` hence avoiding the need to pass `up` itself.

### Using Web Components

You can use any standards-compliant Web Component within `lit-up` apps by installing it as per its own documentation and then using the appropriate tag name and setting its attributes, properties and event handlers (using `up`) accordingly.

```js
import { WiredButton, WiredInput } from "wired-elements"

const view = ({ model, up }) => html` 
  <wired-input placeholder="Name"
		@change=${up(setName)}></wired-input>
  <wired-button
		@click=${up(greet, model.name)}>
			Greet ${model.name}</wired-button>`
```

If you identify a generic component that is commonly reused across different projects and possibly other front-end frameworks, it is a good candidate to be implemented as a Web Component, using a library such as `lit-element` or `haunted`. 

### Using Fragment Functions

If you wish to split up your application into smaller components for the purpose of clarity and organisation, rather than for reuse across different contexts and organisations, building them as Web Components may be overkill. Also, Web Components may not be the best choice for SVG applications as there are some compatibility problems with the SVG namespace.

Fragment functions implement a component, or fragment of the view, as a single function (which may itself call other fragment functions). It can be configured with data properties, event handlers and inner content.

```js
const contentButton = ({ label, content, click }) => html`
	<button @click=${click}>
		${label}
		${content}
	</button>`

const view = ({ model, up }) => html`
	<div class="part-of-the-view">
    ${contentButton({ 
      label: "User",
      content: html`<i class="user-icon" />`
      click: up(showUserProfile)
    })}
		${contentButton({
      label: "News",
      content: html`<img src="news.png" />`
			click: up(showNews)
    })}
  </div>
`
```

This helps to split up and organise the different levels of your application view. For more information see the [Online Guides](https://klaudhaus.com/lit-up/guides).

#### Internal State

What if a fragment should have some inner state that is of no concern to its containing application? One example would be a container that implements transitions between different pages in a navigation model. The containing app should only concern itself with the overall list of pages and which one is currently displayed, whilst the component itself stores both the last selected page and the current one during the transition display. With some imagination this can be approached with fragments, such as by maintaining a state object for each fragment instance within the view model or using an identifer from the model as a key to hold internal state in a module-level WeakMap. However, this is a good example of when it may well make sense to implement a Web Component, or rethink the overall design.

### Model and Update Patterns

There are various modular ways in which the model object and update functions can be structured as your application grows, ranging from Object Oriented to more Functional approaches. Find out more about these options, including the practices adopted at Klaudhaus, in the [Online Guides](https://klaudhaus.com/lit-up/guides).


