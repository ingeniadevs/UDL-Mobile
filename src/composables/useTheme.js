import { ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const THEME_KEY = 'udl-theme'

const isDark = ref(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem(THEME_KEY) !== 'light'
    : true
)

async function persistTheme(dark) {
  const value = dark ? 'dark' : 'light'
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, value)
  }
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: THEME_KEY, value })
  }
}

watch(isDark, (dark) => {
  applyTheme(dark)
  persistTheme(dark)
})

function swapPrimeVueTheme(dark) {
  const themeName = dark ? 'lara-dark-teal' : 'lara-light-teal'
  const newHref = `/themes/${themeName}/theme.css`
  let link = document.getElementById('primevue-theme')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'stylesheet'
    link.id = 'primevue-theme'
    document.head.appendChild(link)
  }
  if (link.href !== newHref && !link.href.endsWith(newHref)) {
    link.href = newHref
  }
}

function applyTheme(dark) {
  const root = document.documentElement
  if (dark) {
    root.classList.remove('theme-light')
    root.classList.add('theme-dark')
  } else {
    root.classList.remove('theme-dark')
    root.classList.add('theme-light')
  }
  swapPrimeVueTheme(dark)
}

export async function hydrateTheme() {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: THEME_KEY })
    if (value) {
      isDark.value = value !== 'light'
    }
  }
  applyTheme(isDark.value)
}

applyTheme(isDark.value)

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
  }
  return { isDark, toggleTheme }
}
