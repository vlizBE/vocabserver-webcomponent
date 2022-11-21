import search from './mu-search.js';
import Template from './template.js';

customElements.define(
  "vocab-search-bar",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.redraw();
    }

    static get observedAttributes() {
      return ["query"];
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
      if (attrName === "query") {
        this.retrieveResults(newVal)
          .then((results) => {
            this.redraw({
              searchResults: results,
              query: newVal,
            });
          })
          .catch();
      }
    }

    redraw(props) {
      this.shadowRoot.innerHTML = Template.render(props);
      this.dom = Template.mapDOM(this.shadowRoot);
      this.dom.searchInput.addEventListener("change", (event) => {
        if (event.target.value) {
          this.query = event.target.value;
        }
      });
    }

    get query() {
      return this.getAttribute("query");
    }

    set query(value) {
      return this.setAttribute("query", String(value));
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
