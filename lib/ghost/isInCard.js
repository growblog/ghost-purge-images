const DEFAULT_CARD_TYPES = ['audio', 'video', 'file', 'image', 'gallery'];

function pathMatches(value, uploadPath) {
  if (typeof value !== 'string' || !uploadPath) {
    return false;
  }
  let from = 0;
  while (from < value.length) {
    const index = value.indexOf(uploadPath, from);
    if (index === -1) {
      return false;
    }
    const after = value[index + uploadPath.length];
    if (!after || /[^A-Za-z0-9._~%-]/.test(after)) {
      return true;
    }
    from = index + uploadPath.length;
  }
  return false;
}

function payloadHasPath(payload, uploadPath) {
  if (typeof payload === 'string') {
    return pathMatches(payload, uploadPath);
  }
  if (Array.isArray(payload)) {
    return payload.some((item) => payloadHasPath(item, uploadPath));
  }
  if (payload && typeof payload === 'object') {
    return Object.keys(payload).some((key) => payloadHasPath(payload[key], uploadPath));
  }
  return false;
}

module.exports = function isInCard(uploadPath, mobiledoc, types = DEFAULT_CARD_TYPES) {
  if (!uploadPath || !mobiledoc) {
    return false;
  }
  let json;
  try {
    json = JSON.parse(mobiledoc);
  } catch (err) {
    return false;
  }
  const allowed = new Set(types.map((type) => String(type).toLowerCase()));
  const cards = Array.isArray(json.cards) ? json.cards : [];
  return cards.some((card) => {
    if (!Array.isArray(card) || card.length === 0) {
      return false;
    }
    const name = String(card[0]).toLowerCase();
    if (!allowed.has(name)) {
      return false;
    }
    return payloadHasPath(card[1], uploadPath);
  });
};
