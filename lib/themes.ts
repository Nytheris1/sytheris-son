export type ThemeId = 'green' | 'red' | 'blue' | 'gold' | 'sakura' | 'mono'
export type ThemeMode = 'light' | 'dark' | 'system'

export const THEMES: { id: ThemeId; name: string; swatch: string; hex: string }[] = [
  { id: 'green', name: 'Green Place', swatch: 'oklch(0.74 0.19 155)', hex: '#10d27f' },
  { id: 'red', name: 'Red Rebellion', swatch: 'oklch(0.62 0.23 27)', hex: '#e5322d' },
  { id: 'blue', name: 'Blue Abyss', swatch: 'oklch(0.62 0.19 258)', hex: '#3b7bf0' },
  { id: 'gold', name: 'Golden Destiny', swatch: 'oklch(0.8 0.15 80)', hex: '#e8b33a' },
  { id: 'sakura', name: 'Sakura Blooms', swatch: 'oklch(0.74 0.14 355)', hex: '#ee8fb6' },
  { id: 'mono', name: 'Monochrome', swatch: 'oklch(0.3 0 0)', hex: '#2a2a2a' },
]

export const THEME_IDS = THEMES.map((t) => t.id)

export function themeName(id: string) {
  return THEMES.find((t) => t.id === id)?.name ?? 'Green Place'
}

export function themeHex(id: string) {
  return THEMES.find((t) => t.id === id)?.hex ?? '#10d27f'
}

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('sy-theme')||'green';var m=localStorage.getItem('sy-mode')||'system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.dataset.theme=t;r.classList.toggle('dark',d);if(localStorage.getItem('sy-reduce-motion')==='1')r.classList.add('reduce-motion');}catch(e){}})();`
