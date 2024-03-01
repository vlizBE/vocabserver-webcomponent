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
| `set-selection`            | array (comma-separated string) | ""            | Set the selected values. This is a list of URIs. The full selection will change whenever this is updated.        |
| `source-datasets`  | array (comma-separated string) | null          | Restricts the search to data from these datasets. If empty, allow all datasets part of `source-vocabularies`. |
| `source-vocabularies`  | array (comma-separated string) | null          | Restricts the search to data from these vocabularies. Can use the original vocabulary URI or an alias of the vocabulary. If `source-datasets` is set, the search will be restricted to terms in these vocabularies AND the `source-datasets`. If empty, will search in all vocabularies. |
| `search-endpoint`  | string | ""            | URL of the search backend                                                                       |
| `languages-string` | string | "\*"          | Comma separated list of ISO languages codes. The search will only show terms in these languages |
| `tags-filter`      | string | null          | Specify allowed tags separated by a comma                                                       |
| `show-error`      | string | true          |  Set if errors should be shown below the search bar. |
| `show-console-error`      | string | true          |  Set if errors should be shown in the console. |

## Custom Events

This Web Component dispatches semantic events upon user interaction. You can bind to these events with the standard DOM APIs, such as `addEventListener`. See MDN for more information about [DOM Events](https://developer.mozilla.org/en-US/docs/Web/Events) and [Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).

With `prefLabelType`: `Object{<iso_language_id>: Array<string>}`.
| Type | `event.detail` type | Description |
|--------------------------|-------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `search-results-changed` | `Array<{uri: string, prefLabel: prefLabelType}>` | Gets dispatched when the search results are changed as a result of the user changing the search parameters. |
| `selection-changed` | `Array<{uri: string, prefLabel: prefLabelType}>` | Gets dispatched when the selection changes after a result is clicked to (de)select it. |

See [`examples/events.html`](https://github.com/vlizBE/vocabserver-webcomponent/blob/main/examples/events.html) for a usage example.

## Development
run `npm start` to activate the web-dev-server. This will serve the `demo.html`, which includes an example of the webcomponent. This can then be used for testing.

This uses a [Vaadin multiselect](https://vaadin.com/docs/latest/components/multi-select-combo-box), defined in https://github.com/vaadin/web-components/tree/main/packages/multi-select-combo-box, combined with [Lit Component](https://lit.dev/docs/components/overview/).

To build, first install rollup with `npm install rollup --global`. Afterwards run `rollup -c`. This will add the build files in `/dist`, as defined in `rollup.config.js`.
