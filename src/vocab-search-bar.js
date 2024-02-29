import search from "./mu-search.js";
import { LitElement, html, css } from "lit";
import { commaSeparatedConverter } from "./attribute-converters.js";
import '@vaadin/multi-select-combo-box';
import {comboBoxRenderer} from '@vaadin/combo-box/lit';
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';

const LABEL_LENGTH = 15;
export default class VocabSearchBar extends LitElement {
  static properties = {
    query: { reflect: true },
    itemsSelected: {state: true},
    initialSelection: {
      converter: commaSeparatedConverter,
      attribute: "initial-selection",
    },
    sourceDatasets: {
      attribute: "source-datasets",
      reflect: true,
      converter: commaSeparatedConverter,
    },
    searchEndpoint: { attribute: "search-endpoint" },
    languagesString: { attribute: "languages-string" },
    tagsFilter: {
      attribute: "tags-filter",
      converter: commaSeparatedConverter,
    },
    showError: { attribute: "show-error", type: Boolean },
    showConsoleError: { attribute: "show-console-error", type: Boolean },
    _isLoading: { state: true, attribute: false },
    comboboxChoices: {state: true, attribute: false},
    error: {state: true, attribute: false}
  };

  static get styles() {
    return css`
      vaadin-multi-select-combo-box {
        width: 100%;
      }
    `;
  }

  constructor() {
    super();
    this.query = null;
    this.itemsSelected = [];
    this.initialSelection = [];
    this.tagsFilter = [];
    this.sourceDatasets = [];
    this.languageString = null;
    this.hideResults = false;
    this._isLoading = false;
    this.comboboxChoices = [];
    this.showError = true;
    this.showConsoleError = true;
  }

  warn(message) {
    if(this.showConsoleError) {
      console.error(message);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._isLoading = true;
    this.loadInitialSelectionsAndAliases();
  }

  updated(changed) {
    if (changed.has("query")) {
      this.retrieveResults().then((results) => {
        // show selected items that are not part of the query at the bottom of the list
        const selectionsOutsideSearch = this.itemsSelected.filter(
          (e) => !results.map((r) => r.uri).includes(e.uri)
        );
        this.comboboxChoices = [...results, ...selectionsOutsideSearch];
        this.dispatchEvent(
          new CustomEvent("search-results-changed", {
            bubbles: true,
            detail: results,
          })
        );
      });
    }

    if (changed.has("sourceDatasets")) {
      this.loadDatasetAliases();
    }

    if (changed.has("initialSelection")) {
      this.loadInitialSelections();
    }
  }

  _errorSpan(message) {
    return html `<span class="error-message">
      ${this.error}
      </span>`
  }
  render() {
    const error = this.error? this._errorSpan(this.error) : html ``;
    return !this._isLoading? html `<div>
      <vaadin-multi-select-combo-box
        filter="${this.query}"
        .filteredItems="${this.comboboxChoices}"
        @filter-changed="${(event) => {
          this.query = event.detail.value;
        }}"
        .selectedItems=${this.itemsSelected}
        @selected-items-changed=${this.selectItems}
        item-label-path="trimmedPrefLabel"
        item-value-path="uri"
        item-id-path="uri"
        ${comboBoxRenderer(this._renderRow, [])}
      ></vaadin-multi-select-combo-box>
      ${error}
    </div>`: html `<div>- loading -</div>`;
  }

  selectItems(e) {
    const newUris = e.detail.value.map((e) => e.uri);
    const oldUris = this.itemsSelected.map((s) => s.uri);
    const addedUris = newUris.filter((newUri) => !oldUris.includes(newUri));
    if (newUris.length === oldUris.length && addedUris.length === 0) {
      // no new uris in event. Do not propagate the change to avoid infinite loop.
      return;
    }
    this.itemsSelected = [...e.detail.value.map(e => this._addTrimmedLabel(e))];
    this.dispatchEvent(
      new CustomEvent("selection-changed", {
        bubbles: true,
        detail: this.itemsSelected,
      })
    );
  }

  _addTrimmedLabel(item) {
    const firstLabel = Object.entries(item.prefLabel)[0][1][0];
    item["trimmedPrefLabel"] =
      firstLabel.length < LABEL_LENGTH
        ? firstLabel
        : firstLabel.substring(0, LABEL_LENGTH) + "...";
    return item;
  }

  _renderRow({ uri, prefLabel, highlight }) {
    // uses inline styling, as Lit styles only in its own shadow dom
    // which seems to not work for the rendered choice list.
    // note: might be fixable with more research.
    return html`
    <div class="combo-box-choice" style="display: flex; align-items: left;">
      <div class="icon" style="margin-right: 25px; cursor: pointer;">
        <a href=${uri} target="_blank">🔗</a>
      </div>
      <div class="text" style="flex-grow: 1;"> 
        ${Object.entries(prefLabel).map((x) => 
          html`
            <li>
              ${x[0]}: ${this.withHighlight(x[1][0], highlight?.[`prefLabel.${x[0]}`])}
            </li>`)}
        ${highlight?.["tagLabels"]? html`
            <li>
               ${unsafeHTML(highlight["tagLabels"].join(", "))}
            </li>`: ""}
      </div>
    </div>
    `;
  }

  withHighlight(originalString, highlights) {
    if(!highlights) return originalString;
    for(const highlight of highlights) {
      const subStringOfHiglight = highlight.replaceAll("<em>", "").replaceAll("</em>", "");
      
      originalString = originalString.replace(subStringOfHiglight, highlight);
    }
    return html `${unsafeHTML(originalString)}`;
  }

  createFilter() {
    let filter = {};

    const languagesString = this.languagesString || "*";

    const prefLabelQueryKey = languagesString
      .split(",")
      .map((x) => `prefLabel.${x}`)
      .join(",");
  
    const tagsQueryKey = "tagLabels"

    const sqs =
      !this.query || this.query?.trim() === ""
        ? "*"
        : this.query
            .split(" ")
            .map((word) => `(${word}*|${word})`)
            .join(" ");

    filter[`:sqs:${prefLabelQueryKey},${tagsQueryKey}`] = sqs;

    if (this.tagsFilter.length > 0) {
      filter[`:terms:tagLabels`] = this.tagsFilter.join(",");
    }

    if (this.sourceDatasets.length > 0) {
      filter[":terms:sourceDataset"] = this.sourceDatasets.join(",");
    }

    return filter;
  }

  async retrieveResults() {
    const page = 0;
    const size = 15;
    const sort = null; // By relevance
    const results = await search(
      "concepts",
      page,
      size,
      sort,
      this.createFilter(),
      (searchData) => {
        const entry = searchData.attributes;
        entry.id = searchData.id;
        entry.highlight = searchData.highlight;
        return entry;
      },
      this.searchEndpoint
    );

    return results.content;
  }

  // fills in the initial selection (that is just a uri)
  // with all information (like prefLabel)
  async loadInitialSelectionsAndAliases() {
    this._isLoading = true;
    await this.loadDatasetAliases();
    await this.loadInitialSelections();
    this._isLoading = false;
  }

  async loadInitialSelections() {
    const promises = [];
    for (const initial of this.initialSelection) {
       promises.push(this.loadSelection(initial));
    }
    await Promise.all(promises);
  }

  async loadDatasetAliases() {
    const promises = [];
    for(const datasetUri of this.sourceDatasets) { 
      promises.push(this.loadDatasetAlias(datasetUri));
    }
    await Promise.all(promises);
  }

  async fetchResource(resource, filters) {
    const endpoint = new URL(`/${resource}`, this.searchEndpoint);
    const params = new URLSearchParams(filters);
    endpoint.search = params.toString();

    const results = await (
      await fetch(endpoint, {
        headers: {
          Accept: "application/json",
        },
      })
    ).json();
    return results;
  }

  async loadSelection(uri) {
    const filters = [];
    filters.push(["filter[:uri:]", uri]);

    for (const dataset of this.sourceDatasets) {
      filters.push([
        "filter[:or:][:exact:source-dataset]",
        dataset,
      ]);
    }
    const data = (await this.fetchResource("concepts", filters)).data;

    if(data.length === 0) {
      this.error = `The initial selected uri "${uri}" was not found or was not part of the specified source datasets.`;
      this.warn(this.error);
      return;
    }

    // replace the option in the selection with an object containing all data like prefLabel
    let selection = data[0];

    selection = {
      ...selection.attributes,
      id: selection.id,
      uuid: selection.id,
    };
    selection.prefLabel = this._convertPrefLabelsResourcesToMuSearch(selection["pref-label"]);
    selection = this._addTrimmedLabel(selection);
    const index = this.itemsSelected.findIndex((s) => s.uri === selection.uri);
    if (index === -1) {
      this.itemsSelected.push(selection);
    }
  }

  async loadDatasetAlias(uri) {
    let filters = [["filter[:or:][:exact:alias]", uri]];
    // mu-cl-resources does not handle :or: correctly if one is a :uri: filter.
    // So doing both filters in one request like this is not possible:
    // filters.push(["filter[:or:][:uri:]", uri]);
    
    let dataset = (await this.fetchResource("datasets", filters)).data;
    if(dataset.length === 0) {
      // try to fetch as the uri of a resource
      filters = [["filter[:uri:]", uri]]
      dataset = (await this.fetchResource("datasets", filters)).data;
    }

    if(dataset.length > 0){
      dataset = {...dataset[0], ...dataset[0].attributes} 
      if(dataset.uri === uri) {
        //nothing to do, dataset uri already set correctly
        return;
      }
      if(dataset.alias === uri) {
        //change the alias to actual uri
        const index = this.sourceDatasets.findIndex(d => d === uri)
        this.sourceDatasets[index] = dataset.uri;
        return;
      }
    }

    // dataset was not found
    this.error = `dataset "${uri}" was not found as a dataset uri or alias of a dataset`
    this.warn(this.error);
  }

  // converts resources structure: [{"content": content, "language": lang}, ...]
  // to mu-search structure: {"lang": [content], ...}
  _convertPrefLabelsResourcesToMuSearch(prefLabel) {
    const searchPrefLabel = {};
    prefLabel.forEach(({ language, content }) => {
      if (!searchPrefLabel[language]) {
        searchPrefLabel[language] = [];
      }
      searchPrefLabel[language].push(content);
    });
    return searchPrefLabel;
  }
}

customElements.define("vocab-search-bar", VocabSearchBar);
