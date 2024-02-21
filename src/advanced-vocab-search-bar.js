import search from "./mu-search.js";
import { LitElement, html, css } from "lit";
import { commaSeparatedConverter } from "./attribute-converters.js";
import '@vaadin/multi-select-combo-box';
import {comboBoxRenderer} from '@vaadin/combo-box/lit';

export default class AdvancedVocabSearchBar extends LitElement {
  static properties = {
    query: { reflect: true },
    itemsSelected: { reflect: true, attribute: "items-selected" },
    initialSelection: {converter: commaSeparatedConverter, attribute: "initial-selection"},
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
    hideResults: { attribute: "hide-results", type: Boolean },
    _isLoading: { state: true },
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
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadInitialSelection();
  }

  updated(changed) {
    if (changed.has("query")) {
      if (!this.query) {
        return;
      }
      this._isLoading = true;
      this.retrieveResults().then((results) => {
        this._isLoading = false;
        // show selected items that are not part of the query at the bottom of the list
        const selectionsOutsideSearch = this.itemsSelected.filter(
          (e) => !(results.map((r) => r.uri).includes(e.uri)))
        this.comboboxChoices = [...results, ...selectionsOutsideSearch]
        this.dispatchEvent(
          new CustomEvent("search-results-changed", {
            bubbles: true,
            detail: results,
          })
        );
      });
    }
  }

  render() {
    return html` <div>
      <vaadin-multi-select-combo-box
        filter="${this.query}"
        .filteredItems="${this.comboboxChoices}"
        @filter-changed="${(event) => {
          this.query = event.detail.value;
        }}"
        .selectedItems=${this.itemsSelected}
        @selected-items-changed=${this.selectItems}
        item-label-path="uri"
        item-value-path="uri"
        item-id-path="uri"
        
        ${comboBoxRenderer(this._renderRow, [])}
      ></vaadin-multi-select-combo-box>
    </div>`;
  }

  selectItems(e) {
    const newUris = e.detail.value.map(e => e.uri);
    const oldUris = this.itemsSelected.map(s => s.uri);
    const addedUris = newUris.filter(newUri => !oldUris.includes(newUri));
    if(newUris.length === oldUris.length && addedUris.length === 0) {
      // no new uris in event. Do not propagate the change to avoid infinite loop.
      return; 
    }
    this.itemsSelected = [...e.detail.value];
    this.dispatchEvent(
      new CustomEvent("selection-changed", {
        bubbles: true,
        detail: this.itemsSelected,
      })
    );
  }

  _renderRow({ uri, prefLabel }) {
    return html`<div class="combo-box-choice">
      <a href=${uri}>${uri}</a>
        ${Object.entries(prefLabel).map(
          (x) => html`<li>${x[0]}: ${x[1]}</li>`
        )}
    </div>`;
  }

  createFilter() {
    let filter = {};

    const languagesString = this.languagesString || "*";

    const queryKey = languagesString
      .split(",")
      .map((x) => `prefLabel.${x}`)
      .join(",");

    const sqs = this.query
      .split(" ")
      .map((word) => `(${word}*|${word})`)
      .join(" ");

    filter[`:sqs:${queryKey}`] = sqs;

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
        return entry;
      },
      this.searchEndpoint
    );

    return results.content;
  }

  async loadInitialSelection() {
    const query = {};
    query[`:terms:uri`] =this.initialSelection.join(",");
    if (this.sourceDatasets.length > 0) {
      query[":terms:sourceDataset"] = this.sourceDatasets.join(",");
    }
    if (this.sourceDatasets.length > 0) {
      query[":terms:sourceDataset"] = this.sourceDatasets.join(",");
    }
    const page = 0;
    const size = 15;
    const sort = null; // By relevance
    const results = await search(
      "concepts",
      page,
      size,
      sort,
      query,
      (searchData) => {
        const entry = searchData.attributes;
        entry.id = searchData.id;
        return entry;
      },
      this.searchEndpoint
    );
    // todo: index the URI and actually use returned content
    const items = this.initialSelection.map((uri) => {return {uri: uri, prefLabel: ""}}); //result.content;
    const alreadySelectedUris = this.itemsSelected.map((s) => s.uri);
    const extraInitialSelections = items.filter((e) => !(alreadySelectedUris).includes(e.uri))
    this.itemsSelected = [...this.itemsSelected, ...extraInitialSelections]
  }
}

customElements.define("advanced-vocab-search-bar", AdvancedVocabSearchBar);
