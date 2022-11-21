import search from "./mu-search.js";
import { LitElement, html } from "./lit-core.min.js";

customElements.define(
  "vocab-search-bar",
  class extends LitElement {
    static properties = {
      query: { attribute: true, reflect: true },
      searchResults: { attribute: false, state: true },
    };

    constructor() {
      super();
      this.searchResults = null;
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
      if (attrName === "query") {
        this.retrieveResults(newVal)
          .then((results) => {
            this.searchResults = results;
          })
          .catch();
      }
    }

    render() {
      return html`
        <div>
          <input
            value=${this.query}
            @change=${(event) => {
              this.query = event.target.value;
            }}
          />
          ${this.searchResults
            ? this.searchResults.length === 0
              ? html`<p>No results found.</p>`
              : this._renderSearchResults()
            : ""}
        </div>
      `;
    }

    _renderSearchResults() {
      return html`<table>
        <thead>
          <tr>
            <th>URI</th>
            <th>prefLabel</th>
            <th>inScheme</th>
          </tr>
        </thead>
        <tbody>
          ${this.searchResults.map((result) => this._renderRow(result))}
        </tbody>
      </table>`;
    }

    _renderRow({ uri, prefLabel, schemePrefLabel }) {
      return html`<tr>
        <td>${uri}</td>
        <td>${prefLabel}</td>
        <td>${schemePrefLabel}</td>
      </tr>`;
    }

    async retrieveResults(query) {
      const page = 0;
      const size = 15;
      const sort = null; // By relevance
      const filter = {
        _all: query,
      };
      const results = await search(
        "concepts",
        page,
        size,
        sort,
        filter,
        (searchData) => {
          const entry = searchData.attributes;
          entry.id = searchData.id;
          return entry;
        }
      );

      return results.content;
    }
  }
);
