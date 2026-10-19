import assert from 'node:assert/strict';
import { build } from 'esbuild';
const { outputFiles } = await build({ stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {CodeBlock} from './src/components/infsh/code-block/code-block';export const html=renderToStaticMarkup(React.createElement(CodeBlock,{language:'python'},'def example(self):\\n    self.value = None'));`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
// Keep module resolution rooted in the project without writing build artifacts.
const { html } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text.replace(/from "([^"]+)"/g, (_, name) => `from ${JSON.stringify(import.meta.resolve(name))}`)).toString('base64'));
assert.match(html, /<code class="[^"]*text-zinc-100/, 'dark code surface needs explicit light text, including unclassified tokens');
assert.match(html, /text-zinc-400 select-none/, 'line numbers must remain readable');
console.log('PASS dark code default text and line-number contrast classes');
