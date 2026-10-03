import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const storageKey = 'cook-helper-theme';
const systemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

function readPreference(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

// Runs before React renders so the first paint uses the selected palette.
applyTheme(readPreference() ?? systemTheme());

export function useTheme() {
  const [preference, setPreference] = useState<Theme | null>(readPreference);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = preference ?? system;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(media.matches ? 'dark' : 'light');
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) {
        setPreference(readPreference());
      }
    };
    onChange();
    media.addEventListener('change', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => applyTheme(theme), [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPreference(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The switch remains usable when browser storage is unavailable.
    }
  }

  return { theme, toggleTheme };
}
