import search from "./mu-search.js";
import { LitElement, html } from "./lit-core.min.js";

const Template = {
  html: function (props) {
    return `
      <div>
      <input id="search-input" value="${props?.query ?? ""}" />
      ${
        props?.searchResults?.length > 0
          ? this.renderResults(props.searchResults)
          : ""
      }
      ${props?.searchResults?.length === 0 ? this.renderPlaceholder() : ""}
      </div>`;
  },
  css: function (props) {
    return "";
  },
  renderRow: function ({ uri, prefLabel, schemePrefLabel }) {
    return `
    <tr>
      <td>${uri}</td>
      <td>${prefLabel}</td>
      <td>${schemePrefLabel}</td>
    </tr>`;
  },
  renderResults: function (results) {
    return `
      <table>
        <thead>
          <tr>
            <th>URI</th>
            <th>prefLabel</th>
            <th>inScheme</th>
          </tr>
        </thead>
        <tbody>
          ${mapJoin(this.renderRow, results)}
        </tbody>
      </table>`;
  },
  renderPlaceholder: () => `
  <p>No results found.</p>
  `,
  render: function (props) {
    return `${this.html(props)}
            ${this.css(props)}`;
  },
  mapDOM(scope) {
    return {
      searchInput: scope.querySelector("#search-input"),
    };
  },
};

customElements.define(
  "vocab-search-bar",
  class extends LitElement {
    static properties = {
      query: { attribute: true, state: false },
      searchResults: { attribute: false, state: true },
    };

    constructor() {
      super();
      this.query = "";
      this.searchResults = null;
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
      if (attrName === "query") {
        console.log(wow);
      }
    }

    render() {
      return html`<input .value=${this.query}/>`;
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
