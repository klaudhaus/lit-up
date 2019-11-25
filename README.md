# lit-up

> Have you seen the light?

A quick way to get up and running with `lit-html` templating and a reactive data flow.

Pass a model object, a view function and an updates collection to the `app` function:

```js
app({ model, view, updates })
```

Then in your templates, use `up` to handle user events:

```html
<button @click=${up("deleteRow", row)}/>
```

## What?

`lit-up` is a small and efficient state pattern library for JavaScript applications that use templates made with `lit-html`. It follows the industry best practice of reactive one-way data flow, as inspired by the Elm Architecture and popularised by Redux, so in a (somewhat oversimplified) way you can imagine that `lit-up` is to `lit-html` as Redux is to React.

## Why?

Existing app structure frameworks can be quite heavyweight, involving (relative to `lit-up`) large downloads, lots of dependencies, steep learning curves and possibly a transpiling toolchain. `lit-up` helps you get up and running more quickly. It is small (< 1kB minified, < 6KB when bundled together with `lit-html`), simple yet powerful, performs well, and can be loaded along with its dependencies as an ES6 module directly in a modern browser.

## Installation

### From CDN

If you want to try `lit-up` without installing anything locally, you can import it within your app's JS file directly from a CDN, like:

```js
import { html, app, up } from "http://cdn.pika.dev/lit-up"
```

Because your app's JS file uses an ES6 import, you'll need to specify `type=module` on the `script` tag, like:

```html
<script src="app.js" type="module"/>
```

### With a package manager

Use your favorite JS package manager, like:

`npm install @klaudhaus/lit-up`

And then reference it at the top of your app's main JavaScript file, like:

```js
import { html, app, up } from "@klaudhaus/lit-up"
```

Again this will need to be within a JavaScript file loaded with the `type=module` attribute shown above. 

#### ES6 module resolution

If you're using the CDN approach this is all handled for you. Otherwise, you'll also need a way for your browser to resolve ES6 modules to their location within `node_modules`. The simplest way is to use `es-dev-server`, as demonstrated by the examples which you can run with:

`npm run examples`

But as browser support for *import maps* continues to roll out you may wish to look into that option too - that way you don't need any special server behavior in development. 

For production builds, you'll generally package your code together with a bundler like `rollup`.

## Basic usage example

Once you've installed `lit-up` as above, your ES6-loaded (`type="module"`) JavaScript file might look like this:

```js
import { html, app, up } from "@klaudhaus/lit-up"

const model = {
  name: "Tim",
  counter: 2
}

const updates = {
  inc () { model.counter++ },
  dec () { model.counter-- }
}

const view = model => html`
	<h1>Hello ${model.name}</h1>
  <button @click=${up("dec")}>-</button>
  <input type="text" disabled value=${model.counter}
  <button @click=${up("inc")}>+</button>
`

app({ model, view, updates })
```

`model` is an object representing the application's *data model*.

`updates` is a set of functions representing the actions that can update the model. It can be a plain object as shown above, or a class which accepts `model` as its constructor parameter.

`view` is a function that takes the model and returns a representation of that model as HTML, using the `html` literal tag from `lit-html` (which is re-exported by `lit-up`). If you haven't seen `lit-html` yet, then head over to it's documentation site to read all about it. 

The special bit that `lit-up` provides is the `up` function, which prepares an event handler (which you link to an event in a `lit-html` template using the `@` symbol) that updates the model and re-renders the view.

## Using `up` 

### Specifying update functions

There are a couple of different ways you can tell `up` what update function to call.

`up((key: String) || (update: Function), data])`

If you pass a `String` to up (as in the above usage example) then `lit-up` looks for that key in the `updates` object that was provided when the `app` was initialised and runs the function it finds there. This is the recommended approach as this allows for clearly labelled logging of all model updates in your application.

If instead you pass a `Function` as the first parameter, then that function itself is used as the update. This can be handy for adding localised processing at a lower level of the application (although there are various other ways to do that too, as described later under "Applications structure"). This also means you can build an app with no `updates` object at all if you want.

### Update data

The second parameter to `up` is a data object, which will be passed on to the update function, e.g.

```js
const model = {
  items: [
    { label: One },
    { label: Two }
  ]
}

const updates = {
  deleteItem: item => {
    model.items.remove(item)
  }
}

const view = model => html`
  ${model.items.map(item => html`
    <li>
			${item.label}
			<button @click=${up("deleteItem", item)}>X</button>
		<li>
  `)
}
```

### Update event

Update functions are called with one additional parameter, the `Event` that triggered the update. This is passed as the second parameter, after the data object.

```js
const updates = {
  setMessageAndName (msg, e)
    model.display = `Message: ${msg}, Input Value: ${e.target.value}`  
  }
}

const view = model => html`
  <input @input=${up("showMessageAndValue", { msg: "Hello" })}
  <div>${display}</div>
`
```

### Asynchronous updates

All update functions are called with `await`. That means that you can use an `async` function, or a function that returns a promise, and `lit-up` will wait for the function to complete before re-rendering the view.

```js
const updates = {
  fetchStatus: async () => {
    const response = await fetch("./status.json")
    const status = await response.JSON()
    model.statusMessage = status.message
  }
}

const view = model => html`
  <button @click=${up("fetchStatus")}>Refresh Status</button>
  <div>${model.statusMessage}</div>
`
```

### Calling `up` from JS

Sometimes you want to trigger an update from somewhere other than a user action, such as a data subscription.

```js
subscribe(myService, data => {
  up("gotServiceInfo")(data)
})

const updates = {
  gotServiceInfo (data) {
    model.serviceInfo = data.serviceInfo
  }
}
```

Note that even if you don't wish to pass specific update data when calling `up` directly from JavaScript, you still need the second set of parentheses, as the result of `up` itself is a function.

### Chained Updates

Updates can return the key of another update to perform in the chain, like:

```js
const updates = {
  startFetch () {
    model.statusMessage = "Waiting..."
    return "continueFetch"
  },
  
  continueFetch () {
    const response = await fetch("./status.json")
    const status = await response.JSON()
    model.statusMessage = status.message
  }
}
```

In this case, rerendering will occur between each update, and the `data` and `event` parameters are passed forwards along the chain.

## Application structure

The examples so far have shown small, single-file scenarios. As your applications grow you will want to split things up into separate modules.

### Web Components

If you identify a generic component that is commonly reused across different projects, it is a good candidate to be implmented as a Web Component, using a library such as `lit-element`. Whilst Web Component development is outside of the scope of this document, using Web Components within `lit-up` apps (or indeed any `lit-html` template) is as easy as referencing the appropriate tag name and setting its attributes, properties and event handlers accordingly.

### Application fragments without Web Components

When you wish to split up your application into smaller modules for the purpose of clarity and organisation, rather than for reuse in different projects and organisations, building them as Web Components may be overkill. Also, using application fragments may work better for SVG applications as there are some problems in using Web Components within the SVG namespace.

#### View functions

At its simplest, a fragment may just need a view, in which case you can export a function that returns a `lit-html` template.

```js
// item-view.js

export const itemView = item => html`<div>${item.label} ${item.estimate}</div>`
```

You can now use that view within any other view.

```js
import { itemView } from "./item-view.js"

const itemList = items => {
  let total = items.reduce((t, i) => t + i.estimate), 0)
  return html`
		<h4>Items</h4>
		${items.map(itemView(item))}
		<div>Total: ${total}</div>
	`
```

#### Update functions

What if the inner view needs to define its own update functions? For example, what if we want to add a completed flag to the individual item view, and define the related update function within that view's module as well. In that case, one approach is to import and extend the global updates module. You can use namespaced keys to avoid collisions, as shown below.

```js
// item-view.js

// Import the global updates object for extension by this module
import { updates } from "./updates.js"

// Extend updates with new update function(s)
Object.assign(updates, {
  itemView: {
    toggleItemCompleted (item) {
      item.completed = !item.completed
    }
  }
})

export const itemView = item => html`
	<div>
		${item.label} ${item.estimate}
		<input type="checkbox" checked=${item.completed} 
			@change=${up("itemView.toggleItemCompleted", item)}/>
	</div>
`
```

### Hidden state (advanced)

What if a fragment needs to have a hidden inner state that is of no concern to its containing application? One example would be a container that transitions between different pages in a navigation model. The containing app should only concern itself with what are the overall list of pages within the navigation and which one is currently displayed, whist the component itself stores both the last selected state and the current one during the transition operation. With a bit of imagination this can also be approached with `lit-up` application fragments, using approaches such as Weak Maps mapping the internal state against some identifier from the fragment's model. However, this is a good example of when it may well make sense to implement a Web Component. 

## Logging mode

You can put `lit-up` into logging mode with an additional app parameter.

```js
app({ model, updates, view, logger: true })
```

All updates will now be logged to the console, with the string key of the update function (or an indicator that a function was passed directly to `up`) and the data and event parameters.

You can alternatively pass a different logging function (default is `console.log`).

```js
const myLogger = (update, data, event) => {
  console.log(`This just happened: ${update}`)
}

app({ model, updates, view, log: myLogger })
```

## Roadmap

* Multiple apps per page (currently the module uses singleton internal state)