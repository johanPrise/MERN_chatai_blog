const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

const ALLOWED_ATTRS = new Set([
  'alt',
  'aria-label',
  'class',
  'data-aos',
  'data-aos-delay',
  'data-aos-duration',
  'data-line-number',
  'href',
  'id',
  'loading',
  'rel',
  'role',
  'src',
  'tabindex',
  'target',
  'title',
  'value',
]);

const URL_ATTRS = new Set(['href', 'src']);
const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const ALLOWED_IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/]+=*$/i;

const isLocalOrAnchorPath = (path: string): boolean => {
  return path.startsWith('#') || path.startsWith('/') || path.startsWith('./') || path.startsWith('../');
};

const isSafeImageSrc = (src: string): boolean => {
  return src.startsWith('blob:') || ALLOWED_IMAGE_DATA_URL.test(src);
};

const isSafeUrl = (value: string, attrName: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (isLocalOrAnchorPath(trimmed)) {
    return true;
  }
  if (attrName === 'src' && isSafeImageSrc(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed, globalThis.location.origin);
    return ALLOWED_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
};

const handleAttributeSanitization = (element: HTMLElement) => {
  Array.from(element.attributes).forEach(attr => {
    const attrName = attr.name.toLowerCase();
    const attrValue = attr.value;
    const isEventOrDisallowed = attrName.startsWith('on') || !ALLOWED_ATTRS.has(attrName);
    const isUnsafeUrl = URL_ATTRS.has(attrName) && !isSafeUrl(attrValue, attrName);

    if (isEventOrDisallowed || isUnsafeUrl) {
      element.removeAttribute(attr.name);
    }
  });

  if (element.tagName.toLowerCase() === 'a' && element.getAttribute('target') === '_blank') {
    element.setAttribute('rel', 'noopener noreferrer');
  }
};

const sanitizeNode = (node: Node): void => {
  if (node.nodeType === Node.COMMENT_NODE) {
    (node as ChildNode).remove();
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  handleAttributeSanitization(element);
};

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
  const nodes: Node[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach(sanitizeNode);
  return doc.body.innerHTML;
};
