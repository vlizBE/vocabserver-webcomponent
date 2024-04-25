import getPaginationMetadata from "./get-pagination-metadata.js";

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

async function muSearch(
  index,
  page,
  size,
  sort,
  filter,
  dataMapping,
  host = "http://127.0.0.1:80"
) {
  const endpoint = new URL(`/${index}/search`, host);
  const params = new URLSearchParams(
    Object.entries({
      "page[size]": size,
      "page[number]": page,
      "highlight[:fields:]": "*",
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

export default muSearch;
