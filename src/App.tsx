import './App.css';
import './theme.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
} from 'react-router-dom';

import { usePreferences, useStorageStatus } from './entities/product/store';
import { ChefPage } from './pages/ChefPage';
import { FridgePage } from './pages/FridgePage';
import { MyRecipePage } from './pages/MyRecipePage';
import { MyRecipesPage } from './pages/MyRecipesPage';
import { RecipePage } from './pages/RecipePage';
import { RecipesPage } from './pages/RecipesPage';
import { UiPage } from './pages/UiPage';
import { useTranslation } from './shared/i18n';
import { useTheme } from './shared/useTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 300_000, refetchOnWindowFocus: false, retry: false },
  },
});

function Shell() {
  const { t, language } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const setLanguage = usePreferences((state) => state.setLanguage);
  const storageError = useStorageStatus((state) => state.error);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = 'Cook Helper';
  }, [language]);
  return (
    <>
      <header className="site-header">
        <Link to="/fridge" className="brand">
          <span className="brand-mark" aria-hidden="true">
            c<span>✦</span>
          </span>
          <span>
            cook<span className="brand-light">helper</span>
            <small>{t.tagline}</small>
          </span>
        </Link>
        <nav
          aria-label={
            language === 'ru' ? 'Основная навигация' : 'Main navigation'
          }
        >
          <NavLink to="/fridge">
            <span aria-hidden="true">▦</span>
            {t.fridge}
          </NavLink>
          <NavLink to="/recipes">
            <span aria-hidden="true">♧</span>
            {t.recipes}
          </NavLink>
          <NavLink to="/chef">
            <span aria-hidden="true">✦</span>
            {t.chef}
          </NavLink>
          <NavLink to="/my-recipes">
            {language === 'ru' ? 'Мои рецепты' : 'My recipes'}
          </NavLink>
          <NavLink to="/ui">UI Lab</NavLink>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={
              language === 'ru'
                ? '\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430'
                : 'Dark theme'
            }
            title={
              language === 'ru'
                ? '\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430'
                : 'Dark theme'
            }
          >
            <span aria-hidden="true">
              {theme === 'dark' ? '\u263e' : '\u2600'}
            </span>
          </button>
          <div
            className="language-switch"
            role="group"
            aria-label={language === 'ru' ? 'Язык' : 'Language'}
          >
            <button
              aria-pressed={language === 'ru'}
              onClick={() => setLanguage('ru')}
            >
              RU
            </button>
            <button
              aria-pressed={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>
      </header>
      <main>
        {storageError && (
          <p role="alert" className="error-message">
            {t.storageError}
          </p>
        )}
        <Routes>
          <Route path="/" element={<Navigate to="/fridge" replace />} />
          <Route path="/fridge" element={<FridgePage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/:id" element={<RecipePage />} />
          <Route path="/my-recipes" element={<MyRecipesPage />} />
          <Route path="/my-recipes/:id" element={<MyRecipePage />} />
          <Route path="/chef" element={<ChefPage />} />
          <Route path="/ui" element={<UiPage />} />
          <Route
            path="*"
            element={
              <section className="empty-state">
                <h1>{t.notFound}</h1>
                <Link to="/fridge">{t.back}</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer>
        <span>
          cookhelper <span className="footer-dot">·</span> {t.phase}
        </span>
        <span>◉ {storageError ? t.storageUnavailable : t.local}</span>
      </footer>
    </>
  );
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
