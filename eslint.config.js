import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  plugins: {
  },
  rules: {
    'style/brace-style': ['error', '1tbs'],
  },
})
