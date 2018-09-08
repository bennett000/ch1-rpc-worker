import nodeResolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: 'dist/expose-tests.js',
    output: {
      file: 'intermediate/test.js',
      format: 'iife',
    },
    plugins: [nodeResolve({ jsnext: true })],
  },
  {
    input: 'dist/expose-tests-worker.js',
    output: {
      file: 'intermediate/test-worker.js',
      format: 'iife',
    },
    plugins: [nodeResolve({ jsnext: true })],
  },
];
