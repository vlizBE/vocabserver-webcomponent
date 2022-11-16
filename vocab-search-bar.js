function sortOrder(sort) {
  if (sort.startsWith("-")) {
    return "desc";
  } else if (sort.length > 0) {
    return "asc";
  }
  return null;
}

function stripSort(sort) {
  return sort.replace(/(^\+)|(^-)/g, "");
}

function snakeToCamel(text) {
  return text.replace(/(-\w)/g, (entry) => entry[1].toUpperCase());
}

async function search(index, page, size, sort, filter, dataMapping) {
  const endpoint = new URL(`/${index}/search`, "http://127.0.0.1:80");
  const params = new URLSearchParams(
    Object.entries({
      "page[size]": size,
      "page[number]": page,
      // eslint-disable-next-line camelcase
      // collapse_uuids: 't',
    })
  );

  for (const field in filter) {
    params.append(`filter[${field}]`, filter[field]);
  }

  if (sort) {
    params.append(`sort[${snakeToCamel(stripSort(sort))}]`, sortOrder(sort));
  }

  endpoint.search = params.toString();

  const { count, data } = await (await fetch(endpoint)).json();
  const pagination = getPaginationMetadata(page, size, count);
  const entries = await Promise.all(data.map(dataMapping));
  return {
    content: entries,
    meta: { count, pagination },
  };
}

function getPaginationMetadata(pageNumber, size, total) {
  const pagination = {};

  pagination.first = {
    number: 0,
    size,
  };

  const lastPageNumber =
    total % size === 0
      ? Math.floor(total / size) - 1
      : Math.floor(total / size);
  const lastPageSize = total % size === 0 ? size : total % size;
  pagination.last = {
    number: lastPageNumber,
    size: lastPageSize,
  };

  pagination.self = {
    number: pageNumber,
    size,
  };

  if (pageNumber > 0) {
    pagination.prev = {
      number: pageNumber - 1,
      size,
    };
  }

  if (pageNumber < lastPageNumber) {
    const nextPageSize =
      pageNumber + 1 === lastPageNumber ? lastPageSize : size;
    pagination.next = {
      number: pageNumber + 1,
      size: nextPageSize,
    };
  }

  return pagination;
}

function mapJoin(f, list, delimiter = "") {
  return list.map(f).join(delimiter);
}

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
