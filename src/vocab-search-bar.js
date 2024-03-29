import search from "./mu-search.js";
import { LitElement, html, css } from "lit";
import { commaSeparatedConverter } from "./attribute-converters.js";
import "@vaadin/multi-select-combo-box";
import { comboBoxRenderer } from "@vaadin/combo-box/lit";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";

const LABEL_LENGTH = 15;
export default class VocabSearchBar extends LitElement {
  static properties = {
    query: { reflect: true },
    itemsSelected: { state: true },
    selections: {
      converter: commaSeparatedConverter,
      attribute: "selections",
      reflect: true,
    },
    sourceDatasets: {
      attribute: "source-datasets",
      reflect: true,
      converter: commaSeparatedConverter,
    },
    sourceVocabularies: {
      attribute: "source-vocabularies",
      reflect: true,
      converter: commaSeparatedConverter,
    },
    searchEndpoint: { attribute: "search-endpoint" },
    isSingleSelect: { attribute: "single-select", type: Boolean },
    languagesString: { attribute: "languages-string" },
    tagsFilter: {
      attribute: "tags-filter",
      converter: commaSeparatedConverter,
    },
    showError: { attribute: "show-error", type: Boolean },
    showConsoleError: { attribute: "show-console-error", type: Boolean },
    _isLoading: { state: true, attribute: false },
    comboboxChoices: { state: true, attribute: false },
    error: { state: true, attribute: false },
    // The combobox will automatically clear the query (empty string) when an item is selected
    // To avoid the search results changing to a query with empty string, set this boolean
    // And skip retrieving new search results if this is set.
    _selectionWasChanged: { state: true, attribute: false },
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
    this.selections = [];
    this.tagsFilter = [];
    this.sourceDatasets = [];
    this.sourceVocabularies = [];
    this.languageString = null;
    this.hideResults = false;
    this._isLoading = false;
    this._selectionWasChanged = false;
    this.comboboxChoices = [];
    this.showError = true;
    this.showConsoleError = true;
    this.previousSelectedItems = [];
  }

  warn(message) {
    if (this.showConsoleError) {
      console.error(message);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._isLoading = true;
    this.loadSetSelectionsAndAliases();
  }

  updated(changed) {
    if (this._isLoading) {
      return;
    }

    // only reload if selections attribute was changed externally
    if (changed.has("selections") && !this._selectionWasChanged) {
      this._isLoading = true;
      this.previousSelectedItems = this.itemsSelected;
      this.itemsSelected = [];
      this.loadSetSelections().then(() => {
        this._isLoading = false;
      });
    }

    if (changed.has("query") && !this._selectionWasChanged) {
      this.retrieveAndShowSearchResults();
    } else {
      this._selectionWasChanged = false;
    }

    if (changed.has("sourceDatasets")) {
      this.retrieveAndShowSearchResults();
    }

    if (changed.has("sourceVocabularies")) {
      // search results might be different for other vocabularies
      this.loadVocabAliases().then(() => this.retrieveAndShowSearchResults());
    }

    if(changed.has("isSingleSelect") && this.isSingleSelect === true) {
      if(this.itemsSelected.length >= 1){
        this.itemsSelected = [this.itemsSelected[0]];
        this.selections = [this.itemsSelected.uri];
      }
    }
  }

  _errorSpan(message) {
    return html`<span class="error-message"> ${this.error} </span>`;
  }
  render() {
    const error = this.error ? this._errorSpan(this.error) : html``;
    return !this._isLoading
      ? html`<div>
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
        </div>`
      : html`<div>- loading -</div>`;
  }

  selectItems(e) {
    const newUris = e.detail.value.map((e) => e.uri);
    const oldUris = this.itemsSelected.map((s) => s.uri);
    const addedUris = newUris.filter((newUri) => !oldUris.includes(newUri));
    if (newUris.length === oldUris.length && addedUris.length === 0) {
      // no new uris in event. Do not propagate the change to avoid infinite loop.
      return;
    }
    this.itemsSelected = [
      ...e.detail.value.map((e) => this._addTrimmedLabel(e)),
    ];
    if(this.isSingleSelect) {
      const addedItem = this.itemsSelected.find(e => e.uri === addedUris[0])
      this.itemsSelected = addedItem? [addedItem] : []
    }
    this.dispatchEvent(
      new CustomEvent("selection-changed", {
        bubbles: true,
        detail: this.itemsSelected,
      })
    );
    this.selections = this.itemsSelected.map((i) => i.uri);
    this._selectionWasChanged = true;
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
          ${Object.entries(prefLabel).map(
            (x) =>
              html` <li class="pref-label">
                ${x[0]}:
                ${this.withHighlight(x[1][0], highlight?.[`prefLabel.${x[0]}`])}
              </li>`
          )}
          ${highlight?.["tagLabels"]
            ? html` <li class="tag-label">
                ${unsafeHTML(highlight["tagLabels"].join(", "))}
              </li>`
            : ""}
        </div>
      </div>
    `;
  }

  withHighlight(originalString, highlights) {
    if (!highlights) return originalString;
    for (const highlight of highlights) {
      const subStringOfHiglight = highlight
        .replaceAll("<em>", "")
        .replaceAll("</em>", "");

      originalString = originalString.replace(subStringOfHiglight, highlight);
    }
    return html`${unsafeHTML(originalString)}`;
  }

  createFilter() {
    let filter = {};

    const languagesString = this.languagesString || "*";

    const prefLabelQueryKey = languagesString
      .split(",")
      .map((x) => `prefLabel.${x}`)
      .join(",");

    const tagsQueryKey = "tagLabels";

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

    if (this.sourceVocabularies.length > 0) {
      filter[":terms:vocabulary"] = this.sourceVocabularies.join(",");
    }

    return filter;
  }

  async retrieveAndShowSearchResults() {
    const page = 0;
    const size = 15;
    const sort = null; // By relevance
    const fetchedResults = await search(
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
    const results = fetchedResults.content;
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
  }

  // fills in the set selection (that is just a uri)
  // with all information (like prefLabel)
  async loadSetSelectionsAndAliases() {
    this._isLoading = true;
    await this.loadVocabAliases();
    await this.loadSetSelections();
    this._isLoading = false;
  }

  async loadSetSelections() {
    const promises = [];
    for (const selection of this.selections) {
      promises.push(this.loadSelection(selection));
    }
    await Promise.all(promises);
  }

  async loadVocabAliases() {
    const promises = [];
    for (const vocabUri of this.sourceVocabularies) {
      promises.push(this.loadVocabAlias(vocabUri));
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
    // check if item alrady part of selection list
    const index = this.itemsSelected.findIndex((s) => s.uri === uri);
    if (index !== -1) {
      return;
    }

    // see if item was selected before. If so, the needed data is already present
    const alreadyRetrievedItem = this.previousSelectedItems.find(
      (item) => item.uri === uri
    );
    if (alreadyRetrievedItem) {
      this.itemsSelected.push(alreadyRetrievedItem);
      return;
    }

    // have to fetch the data for this uri
    const filters = [];
    filters.push(["filter[:uri:]", uri]);

    for (const dataset of this.sourceDatasets) {
      filters.push(["filter[:or:][:exact:source-dataset]", dataset]);
    }
    const data = (await this.fetchResource("concepts", filters)).data;

    if (data.length === 0) {
      this.error = `The initial selected uri "${uri}" was not found or was not part of the specified source datasets and vocabs.`;
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
    selection.prefLabel = this._convertPrefLabelsResourcesToMuSearch(
      selection["pref-label"]
    );
    selection = this._addTrimmedLabel(selection);
    this.itemsSelected.push(selection);
  }

  async loadVocabAlias(uri) {
    let filters = [["filter[:or:][:exact:alias]", uri]];
    // mu-cl-resources does not handle :or: correctly if one is a :uri: filter.
    // So doing both filters in one request like this is not possible:
    // filters.push(["filter[:or:][:uri:]", uri]);

    let vocab = (await this.fetchResource("vocabularies", filters)).data;
    if (vocab.length === 0) {
      // try to fetch as the uri of a resource
      filters = [["filter[:uri:]", uri]];
      vocab = (await this.fetchResource("vocabularies", filters)).data;
    }

    if (vocab.length > 0) {
      vocab = { ...vocab[0], ...vocab[0].attributes };
      if (vocab.uri === uri) {
        //nothing to do, dataset uri already set correctly
        return;
      }
      if (vocab.alias === uri) {
        //change the alias to actual uri
        const index = this.sourceVocabularies.findIndex((d) => d === uri);
        this.sourceVocabularies[index] = vocab.uri;
        return;
      }
    }

    // vocab was not found
    this.error = `vocab "${uri}" was not found as a vocab uri or alias of a vocab`;
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
