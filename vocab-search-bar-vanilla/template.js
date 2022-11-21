function mapJoin(f, list, delimiter = "") {
  return list.map(f).join(delimiter);
}

export default {
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
