'use client';

import {Moon, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';
import {useEffect, useState} from 'react';

export function ThemeToggle() {
  const {theme, setTheme, resolvedTheme} = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <button className="iconButton" aria-label="theme switcher" />;

  const current = theme === 'system' ? resolvedTheme : theme;

  return (
    <button className="iconButton" aria-label="toggle theme" onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}>
      {current === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
