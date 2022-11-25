import search from "./mu-search.js";
import { LitElement, html } from "./lit-core.min.js";

customElements.define(
  "vocab-search-bar",
  class extends LitElement {
    static properties = {
      query: { attribute: true, reflect: true },
      searchResults: { attribute: false, state: true },
      sourceDataset: { reflect: true },
      searchEndpoint: { attribute: "search-endpoint" },
    };

    constructor() {
      super();
      this.query = null;
      this.sourceDataset = null;
      this.searchResults = null;
    }

    updated(changed) {
      if (changed.has("query")) {
        if (this.query === "") {
          return;
        }
        this.retrieveResults().then((results) => {
          this.searchResults = results;
          this.dispatchEvent(
            new CustomEvent("search-results-changed", {
              bubbles: true,
              detail: { results },
            })
          );
        });
      }
    }

    render() {
      return html`
        <div>
          <input
            .value=${this.query}
            @change=${(event) => {
              this.query = event.target.value;
            }}
          />
          ${this.searchResults
            ? this.searchResults.length === 0
              ? html`<p>No results found.</p>`
              : this._renderSearchResults()
            : ""}
        </div>`;
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
      return html`<tr
        @click=${() => this._onRowClicked({ uri, prefLabel, schemePrefLabel })}
      >
        <td>${uri}</td>
        <td>${prefLabel}</td>
        <td>${schemePrefLabel}</td>
      </tr>`;
    }

    _onRowClicked(data) {
      this.dispatchEvent(
        new CustomEvent("search-result-clicked", {
          bubbles: true,
          detail: data,
        })
      );
    }

    async retrieveResults() {
      const page = 0;
      const size = 15;
      const sort = null; // By relevance
      const filter = {
        _all: this.query,
        sourceDataset: this.sourceDataset,
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
        },
        this.searchEndpoint
      );

      return results.content;
    }
  }
);
