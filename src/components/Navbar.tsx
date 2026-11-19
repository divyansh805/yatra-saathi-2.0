import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Globe, LogOut, Menu, User, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { LANGUAGE_LABELS, useTranslationStrings } from '../utils/i18n';
import type { LanguageCode } from '../types/travel';
import { BrandMark } from './BrandMark';
import { RevealGroup, RevealItem } from './Reveal';
import { EASE_PRIMARY, STAGGER_CARDS_MS } from '../motion/tokens';

export function Navbar({
  transparentOverHero = false,
  darkEditorial = false,
}: {
  transparentOverHero?: boolean;
  darkEditorial?: boolean;
}) {
  const { user, logout, language, setLanguage } = useApp();
  const t = useTranslationStrings(language);
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const useLightText = darkEditorial || (transparentOverHero && !scrolled && !mobileOpen);

  const navItems = [
    { to: user ? '/dashboard' : '/', label: t.navHome },
    { to: '/travel-assist', label: t.navTravelAssist },
    { to: '/explore', label: t.navExplorePlan },
    { to: '/stay-reality', label: t.navStayReality },
  ];

  const handleLogout = async () => {
    setMobileOpen(false);
    navigate('/', { replace: true });
    await logout();
  };

  const headerSurfaceClass = darkEditorial
    ? scrolled || mobileOpen
      ? 'bg-[#0A0D0C]/86 backdrop-blur-xl border-b border-white/12 text-[#F8F6F0] shadow-[0_8px_30px_rgba(0,0,0,0.28)]'
      : 'bg-transparent border-b border-transparent text-[#F8F6F0]'
    : transparentOverHero
    ? scrolled || mobileOpen
      ? 'bg-[#F8F6F0]/92 backdrop-blur-xl border-b border-[#E5DFD3] text-[#142322] shadow-xs'
      : 'bg-transparent border-b border-transparent text-white'
    : scrolled || mobileOpen
    ? 'bg-[#FDFBF7] border-b border-[#D6CEBC] text-[#142322] shadow-[0_6px_22px_-8px_rgba(18,61,58,0.16)]'
    : 'bg-[#FCFBF7] border-b border-[#DFD8C8] text-[#142322] shadow-[0_4px_16px_-8px_rgba(18,61,58,0.10)]';

  const isInternalSolidNav = !darkEditorial && !transparentOverHero;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,box-shadow,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${headerSurfaceClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand wordmark */}
        <Link
          to={user ? '/dashboard' : '/'}
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A] rounded-md"
        >
          <BrandMark light={useLightText} />
        </Link>

        {/* Zone 2: Concise single-line nav links with load stagger, left-to-right hover underline & gliding active bar */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center">
          <RevealGroup
            immediate
            staggerMs={STAGGER_CARDS_MS}
            className="flex items-center gap-2 lg:gap-4"
          >
            {navItems.map((item, idx) => {
              const active =
                location.pathname === item.to ||
                (item.to !== '/' && item.to !== '/dashboard' && location.pathname.startsWith(item.to));

              if (isInternalSolidNav) {
                return (
                  <RevealItem key={item.to} index={idx}>
                    <Link
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={`ys-nav-link relative inline-block px-3.5 py-2 rounded-xl text-sm lg:text-[15px] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A] ${
                        active
                          ? 'bg-[#123D3A] text-white font-semibold shadow-2xs'
                          : 'text-[#394543] font-medium hover:text-[#123D3A] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && (
                        <motion.span
                          layoutId={prefersReducedMotion ? undefined : 'nav-active-underline'}
                          transition={{ duration: 0.35, ease: EASE_PRIMARY }}
                          className="absolute left-3.5 right-3.5 bottom-0.5 h-[2px] rounded-full bg-[#E9A34A]"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </RevealItem>
                );
              }

              return (
                <RevealItem key={item.to} index={idx}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`ys-nav-link relative inline-block text-sm lg:text-[15px] font-medium whitespace-nowrap shrink-0 px-1.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A] rounded-sm ${
                      active
                        ? 'text-current font-semibold'
                        : useLightText
                        ? 'text-white/85 hover:text-white'
                        : 'text-[#394543] hover:text-[#123D3A]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && (
                      <motion.span
                        layoutId={prefersReducedMotion ? undefined : 'nav-active-underline'}
                        transition={{ duration: 0.35, ease: EASE_PRIMARY }}
                        className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full bg-[#E9A34A]"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </nav>

        {/* Zone 3: Language + Login or Profile + Logout */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
          <label
            className={`inline-flex items-center gap-1.5 text-sm font-medium shrink-0 ${
              isInternalSolidNav
                ? 'px-2.5 py-1 rounded-lg bg-[#F5F1E8] border border-[#E2DAC9]'
                : ''
            }`}
          >
            <Globe className="w-4 h-4 opacity-80 text-current" aria-hidden="true" />
            <span className="sr-only">Select language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label="Language selector"
              className={`bg-transparent text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A] rounded px-1 py-1 min-h-[34px] ${
                useLightText ? 'text-white [&>option]:text-[#142322]' : 'text-[#2B3735]'
              }`}
            >
              {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>
          </label>

          {user ? (
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/profile"
                className={`ys-btn-secondary inline-flex items-center gap-2 text-[15px] font-medium whitespace-nowrap shrink-0 px-3 py-1.5 min-h-[42px] rounded-xl transition-colors ${
                  useLightText
                    ? 'text-white hover:bg-white/10'
                    : isInternalSolidNav
                    ? 'text-[#123D3A] bg-[#F5F1E8] border border-[#E2DAC9] hover:border-[#123D3A]/40'
                    : 'text-[#123D3A] hover:bg-[#123D3A]/5'
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-[#123D3A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate">{user.name}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="ys-btn-primary inline-flex items-center gap-1.5 px-4 py-2 min-h-[42px] text-sm font-semibold rounded-xl bg-[#E9A34A] text-[#142322] hover:bg-[#DF9538] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                {t.navLogout}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ys-btn-primary inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] text-[15px] font-semibold rounded-xl bg-[#E9A34A] text-[#142322] hover:bg-[#df9538] transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              {t.navLogin}
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A]"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE_PRIMARY }}
            className="md:hidden bg-[#FCFBF7] text-[#142322] border-t border-[#DFD8C8] px-4 py-4 space-y-3 shadow-lg"
          >
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const active =
                  location.pathname === item.to ||
                  (item.to !== '/' && item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`px-3.5 py-3 min-h-[44px] rounded-xl text-base font-medium flex items-center justify-between transition-colors ${
                      active
                        ? 'bg-[#123D3A] text-white font-semibold'
                        : 'hover:bg-[#EFECE3] text-[#142322]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-[#E9A34A]" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-[#E5DFD3] flex flex-wrap items-center justify-between gap-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                aria-label="Language selector"
                className="bg-white border border-[#D7CFC1] rounded-lg px-3 py-2.5 text-sm font-medium min-h-[44px]"
              >
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_LABELS[code]}
                  </option>
                ))}
              </select>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="px-3.5 py-2.5 min-h-[44px] inline-flex items-center text-sm font-semibold text-[#123D3A] bg-white border border-[#D7CFC1] rounded-lg"
                  >
                    {user.name}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#123D3A] rounded-lg cursor-pointer"
                  >
                    {t.navLogout}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 min-h-[44px] inline-flex items-center text-[15px] font-semibold rounded-lg bg-[#E9A34A] text-[#142322]"
                >
                  {t.navLogin}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
