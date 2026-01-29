import { ref, onMounted, onUnmounted } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQueryList: MediaQueryList | undefined

  const updateMatch = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      mediaQueryList = window.matchMedia(query)
      matches.value = mediaQueryList.matches
      mediaQueryList.addEventListener('change', updateMatch)
    }
  })

  onUnmounted(() => {
    if (mediaQueryList) {
      mediaQueryList.removeEventListener('change', updateMatch)
    }
  })

  return matches
}