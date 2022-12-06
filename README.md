# Vocab Search Component

## Installation

### Standalone

Run `python -m http.server` inside the root of this repository.

### Inside other project

**TODO:** include specific instructions for different frameworks (react, emberjs, ...)

Copy the `vocab-search-bar-lit` folder to the root of your project. Add `<script type="module" src="vocab-search-bar-lit/main.js"></script>` to the header of the html files where the component will be used.

## Usage

```html
<vocab-search-bar
  query="<initial query>"
  source-dataset="<uri>"
  search-endpoint="<uri-of-search-endpoint>"
>
</vocab-search-bar>
```

### Attributes/properties

- `query`: the search query
- `source-datasets`: restricts the search to a comma separated list of datasets.
- `search-endpoint`: url of the search backend

### Custom Events
Some Custom Events that are dispatched by the component. See MDN for more information about [DOM Events](https://developer.mozilla.org/en-US/docs/Web/Events) and [Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).
| Type                     | `event.detail` type                       | Description                                                                                                 |
|--------------------------|-------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `search-results-changed` | `Array<{uri: string, prefLabel: string}>` | Gets dispatched when the search results are changed as a result of the user changing the search parameters. |
| `search-result-clicked`  | `{uri: string, prefLabel: string}`        | Gets dispatched when a search result is clicked in the default results view.                                |

See [`examples/events.html`](https://github.com/vlizBE/vocabserver-webcomponent/blob/main/examples/events.html) for a usage example.