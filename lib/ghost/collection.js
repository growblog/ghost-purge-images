const client = require('./client');

function readCollection(body, resourceKey, label) {
  const items = body && body[resourceKey];
  const pagination = body && body.meta && body.meta.pagination;
  const pages = pagination ? pagination.pages : undefined;
  const validItems = Array.isArray(items);
  const validPages = Number.isInteger(pages) && pages >= 0;
  const hidesItems = validItems && pages === 0 && items.length > 0;
  if (!validItems || !validPages || hidesItems) {
    throw new Error(`${label} API - Not valid response: ${JSON.stringify(body)}`);
  }
  return { items, pages };
}

async function fetchAllPages({
  buildUrl, resourceKey, label, getHeaders
}) {
  let currentPage = 1;
  let totalPages = 1;
  const output = [];

  do {
    const headers = typeof getHeaders === 'function' ? getHeaders() : getHeaders;
    // Pagination is ordered: each response tells us whether another page exists.
    // eslint-disable-next-line no-await-in-loop
    const body = await client.getJson(buildUrl(currentPage), headers ? { headers } : undefined);
    const page = readCollection(body, resourceKey, label);
    totalPages = page.pages;
    currentPage += 1;
    output.push(...page.items);
  } while (currentPage <= totalPages);

  return output;
}

module.exports = {
  fetchAllPages,
  readCollection
};
