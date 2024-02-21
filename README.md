# Vocab Search Component

## Installation

```
$ npm install --save vocab-search-search-bar
```

## Usage

### Script

Import as a module:

```
import 'vocab-search-search-bar'
```

With a script tag:

```
<script type="module" src="./node_modules/vocab-search-search-bar/dist/vocab-search-bar.js"></script>
```

### Markup

```html
<vocab-search-bar
  query="<initial query>"
  source-dataset="<uri>"
  search-endpoint="<uri-of-search-endpoint>"
>
</vocab-search-bar>
```

### Attributes/properties

| Name               | Type   | Default Value | Description                                                                                     |
| ------------------ | ------ | ------------- | ----------------------------------------------------------------------------------------------- |
| `query`            | string | ""            | The search query. Can set an initial value to used to create the initial results list.          |
| `initial-selection`            | array (comma-separated string) | ""            | Set the initial selected values. This is a list of uris          |
| `source-datasets`  | array (comma-separated string) | null          | Restricts the search to data from these datasets                                                |
| `search-endpoint`  | string | ""            | URL of the search backend                                                                       |
| `languages-string` | string | "\*"          | Comma separated list of ISO languages codes. The search will only show terms in these languages |
| `tags-filter`      | string | null          | Specify allowed tags separated by a comma                                                       |

## Custom Events

This Web Component dispatches semantic events upon user interaction. You can bind to these events with the standard DOM APIs, such as `addEventListener`. See MDN for more information about [DOM Events](https://developer.mozilla.org/en-US/docs/Web/Events) and [Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).
| Type | `event.detail` type | Description |
|--------------------------|-------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `search-results-changed` | `Array<{uri: string, prefLabel: string}>` | Gets dispatched when the search results are changed as a result of the user changing the search parameters. |
| `selection-changed` | `{uri: string, prefLabel: {<iso_language_id>: string}}` | Gets dispatched when the selection changes after a result is clicked to (de)select it. |

See [`examples/events.html`](https://github.com/vlizBE/vocabserver-webcomponent/blob/main/examples/events.html) for a usage example.

## Development
run `npm start` to activate the web-dev-server. This will werve the `demo.html`, which includes an example of the webcomponent. This can then be used for testing.

This uses a [Vaadin multiselect](https://vaadin.com/docs/latest/components/multi-select-combo-box), defined in https://github.com/vaadin/web-components/tree/main/packages/multi-select-combo-box, combined with [Lit Component](https://lit.dev/docs/components/overview/).