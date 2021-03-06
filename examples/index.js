// A simple app showing examples of using lit-up

import { app } from "../lit-up.js"
import { render, html } from "lit-html"
import { classMap } from "lit-html/directives/class-map"

// Create a promise of a short delay
const wait = (delay = 100) => new Promise(resolve => setTimeout(resolve, delay))

// The data model for the examples application
const model = {
  inputText: "",
  remoteData: "",
  options: [
    { label: "Mars" },
    { label: "Jupiter" },
    { label: "Venus" }
  ],
  selectedOption: null
}

// User actions that may update the data model

// Example of an action that reads event data
function mirrorValue (data, evt) {
  model.inputText = evt.target.value
}

// Example of an action with an asynchronous result
async function fetchData () {
  model.remoteData = "Fetching remote data now..."
  return continueFetchData
}

async function continueFetchData () {
  await wait(1000)
  const response = await fetch("data.json")
  const data = await response.json()
  model.remoteData = data.value
}

// Example of an action with attached data
function select (option) {
  model.selectedOption = option
}

// UI for an entry field with mirrored value
const inputView = model => html`
  <h2>Mirror value from input field</h2>
  <input type="text" @input=${up(mirrorValue)}/>
  <p> ${model.inputText || "No input value entered"} </p>
`

// UI for a data fetch and display
const fetchView = model => html`
  <h2>Fetch remote data</h2>
  <button @click=${up(fetchData)}>Fetch</button>
  <p> ${model.remoteData || "No data fetched yet"} </p>
`

// UI for a selection between options
const optionView = (option, selected) => html`
  <li @click=${up(select, option)}
      class="${classMap({ selected })}" >
      ${option.label}
  </li>
`
const highlightView = model => html`
  <h2>Highlight a selection</h2>
  ${model.options.map(o => optionView(o, model.selectedOption === o))}
  <p> ${model.selectedOption ? model.selectedOption.label : "No selection made"} </p>
`

// UI that contains all examples
const view = ({ model }) => html`
  <h1>lit-up examples</h1>
  ${inputView(model)}
  ${fetchView(model)}
  ${highlightView(model)}
`
// Use a simple pattern for accessing `up` as an arg to `bootstrap`
let up

const bootstrap = ({ up: _up, url }) => {
  console.log("Starting lit-up examples", url)
  up = _up
}

// Launch the app
app({ model, view, render, bootstrap, logger: true })
