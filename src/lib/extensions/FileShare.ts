import { Node, mergeAttributes } from '@tiptap/core';

/**
 * 网盘分享链接排版
 * 用法: editor.commands.insertFileShare({ url: '...', code: '...', name: '百度网盘' })
 * 渲染: <div data-file-share data-url="..." data-code="..." data-name="...">...</div>
 */
export interface FileShareOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileShare: {
      insertFileShare: (attrs: { url: string; code: string; name?: string }) => ReturnType;
    };
  }
}

export const FileShareExtension = Node.create<FileShareOptions>({
  name: 'fileShare',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: { default: '' },
      code: { default: '' },
      name: { default: '网盘链接' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-file-share]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-file-share': '',
        'data-url': HTMLAttributes.url,
        'data-code': HTMLAttributes.code,
        'data-name': HTMLAttributes.name || '网盘链接',
        class: 'file-share-block',
      }),
    ];
  },

  addCommands() {
    return {
      insertFileShare:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                url: attrs.url,
                code: attrs.code,
                name: attrs.name || '网盘链接',
              },
            })
            .run();
        },
    };
  },
});
