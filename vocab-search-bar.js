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

customElements.define(
  "vocab-search-bar",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      const template = document.getElementById("vocab-search-bar-template");
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      const searchQueryInput =
        this.shadowRoot.getElementById("search-query-input");
      this.resultsTableDiv = document.createElement("div");
      this.shadowRoot.appendChild(this.resultsTableDiv);
      searchQueryInput.addEventListener("change", async (event) => {
        const query = event.target.value;
        const results = await this.retrieveResults(query);
        this.resultsTableDiv.innerHTML = this.constructTable(results).outerHTML;
      });
    }

    constructTable(data) {
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      const uriHeader = document.createElement("th");
      const prefLabelHeader = document.createElement("th");
      const inSchemeHeader = document.createElement("th");

      uriHeader.innerHTML = "URI";
      prefLabelHeader.innerHTML = "prefLabel";
      inSchemeHeader.innerHTML = "inScheme";

      headerRow.appendChild(uriHeader);
      headerRow.appendChild(prefLabelHeader);
      headerRow.appendChild(inSchemeHeader);

      thead.appendChild(headerRow);

      const tbody = document.createElement("tbody");
      for (const entry of data) {
        tbody.appendChild(this.constructRow(entry));
      }

      table.appendChild(thead);
      table.appendChild(tbody);

      return table;
    }

    constructRow({ uri, prefLabel, schemePrefLabel }) {
      const row = document.createElement("tr");

      row.appendChild(document.createElement("td")).innerHTML = uri;
      row.appendChild(document.createElement("td")).innerHTML = prefLabel;
      row.appendChild(document.createElement("td")).innerHTML = schemePrefLabel;

      return row;
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
