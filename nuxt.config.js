// Sub-path the site is served from, e.g. '/sundays-left/' on GitHub Pages.
// Set by the deploy workflow; defaults to '/' for local dev.
const base = process.env.NUXT_BASE || '/'
const withBase = (path) => base.replace(/\/$/, '') + path

const appleTouchIcons = [
  '57',
  '60',
  '72',
  '76',
  '114',
  '120',
  '144',
  '152',
  '180',
].map((size) => ({
  rel: 'apple-touch-icon',
  sizes: `${size}x${size}`,
  href: withBase(`/icons/apple-icon-${size}x${size}.png`),
}))
const pngIcons = ['16', '32', '96'].map((size) => ({
  rel: 'icon',
  type: 'image/png',
  href: withBase(`/icons/favicon-${size}x${size}.png`),
  sizes: `${size}x${size}`,
}))

export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Sundays Left · Your life in weeks',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content:
          'On most days, life is sort of happening, passing you by. You are just busy keeping your head above water. So it is not easy to figure out what to do with your life and how to spend your time. Sundays Left lets you track how many weeks of your life you have spent already and how many you have left.',
      },
      { name: 'format-detection', content: 'telephone=no' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: withBase('/favicon.ico') },
      { rel: 'apple-touch-icon', href: withBase('/icons/apple-icon.png') },
      ...appleTouchIcons,
      ...pngIcons,
      { rel: 'manifest', href: withBase('/manifest.json') },
    ],
  },

  router: { base },

  // GitHub Pages serves 404.html for unknown paths
  generate: { fallback: '404.html' },

  // Global CSS: https://go.nuxtjs.dev/config-css
  // app.scss last so its theme wins over Element UI's reset
  css: [
    'element-ui/lib/theme-chalk/index.css',
    'element-ui/lib/theme-chalk/reset.css',
    '@/assets/sass/app.scss',
  ],
  styleResources: { scss: ['@/assets/sass/element-variables.scss'] },

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ['@/plugins/element-ui', '@/plugins/persist.client'],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    'nuxt-typed-vuex',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    transpile: [/^element-ui/],
    // Never try to use the native `fibers` addon (deprecated, and it can't
    // build on modern Node); dart-sass is fast enough without it
    loaders: {
      scss: { sassOptions: { fiber: false } },
      sass: { sassOptions: { fiber: false } },
    },
  },
}
