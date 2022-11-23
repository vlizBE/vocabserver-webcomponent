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
    schemeuri="https://some.uri.com">
</vocab-search-bar>
```

### Attributes/properties
- `query`: the search query
- `schemeuri`: restricts the search to a singe scheme