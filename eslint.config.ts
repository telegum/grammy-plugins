import antfu from '@antfu/eslint-config'

export default antfu({
  stylistic: {
    semi: false,
    quotes: 'single',
    indent: 2,
  },
  formatters: {
    markdown: 'dprint',
  },
})
