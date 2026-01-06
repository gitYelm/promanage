import sanitizeHtml from 'sanitize-html'

/**
 * HTML 内容清洗配置
 * 用于防止 XSS 攻击，移除危险的 HTML 标签和属性
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  // 允许的标签（富文本编辑器常用标签）
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'del',
    'ins',
    'sub',
    'sup',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
    'div',
    'mark',
  ],
  // 允许的属性
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'style'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  // 允许的样式属性
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
      'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'font-weight': [/^bold$/, /^normal$/, /^\d+$/],
      'text-decoration': [/^underline$/, /^line-through$/, /^none$/],
    },
  },
  // 允许的 URL 协议
  allowedSchemes: ['http', 'https', 'mailto'],
  // 允许的 URL 协议（针对 img src）
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  // 链接自动添加 rel="noopener noreferrer"
  transformTags: {
    a: (tagName, attribs) => {
      return {
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }
    },
  },
  // 不允许空标签
  exclusiveFilter: (frame) => {
    // 移除空的 script、style、iframe 等危险标签（即使它们不在允许列表中）
    return (
      ['script', 'style', 'iframe', 'object', 'embed', 'form'].includes(frame.tag) ||
      // 移除包含 javascript: 的链接
      (frame.tag === 'a' && frame.attribs.href?.toLowerCase().startsWith('javascript:'))
    )
  },
}

/**
 * 清洗 HTML 内容，移除潜在的 XSS 攻击代码
 * @param html 原始 HTML 内容
 * @returns 清洗后的安全 HTML
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html) return ''
  return sanitizeHtml(html, sanitizeOptions)
}
