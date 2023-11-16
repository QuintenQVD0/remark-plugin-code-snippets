import type { Plugin, Transformer } from 'unified';
import type { Parent } from 'unist';
import type { MDASTNode } from '../common/types';
import type { InferLanguageOptions } from './types';

import { codeSnippetRegex } from '../common/codeSnippetRegex';

const langCodeSnippetRegex = new RegExp(`^${codeSnippetRegex.source}$`);

type TransformNodeOptions = Required<Pick<InferLanguageOptions, 'extensions'>>;

const transformNode = (node: MDASTNode, { extensions }: TransformNodeOptions) => {
  const match = node.lang?.match(langCodeSnippetRegex); 
  const matchStr = match?.[0] ?? '';
  const file = match?.groups?.file;
  if (file) {
    const ext = file.substring(file.lastIndexOf('.') + 1);
    node.lang = extensions[ext] ?? ext;
    node.meta = node.meta ? `${node.meta} ${matchStr}` : matchStr;
  }
};

const isMDASTNode = (node: MDASTNode | Parent): node is MDASTNode => {
  return 'value' in node; // Assuming 'value' is a property unique to MDASTNode
};

const attacher: Plugin = ((options: InferLanguageOptions) => {
  const extensions = options?.extensions ?? {};

  const transformer: Transformer = (node: MDASTNode | Parent) => {
    if (isMDASTNode(node) && node.type === 'code') {
      transformNode(node, { extensions });
      return undefined;
    }
    if (isMDASTNode(node) && Array.isArray(node.children)) {
      for (const child of node.children) {
        transformer(child, undefined, undefined);
      }
    }
    return undefined;
  };

  return transformer;
}) as Plugin;

export default attacher;