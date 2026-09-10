"use client";

import { useCallback, useEffect, useState } from "react";

export const MAX_CHAPTER = 1430;
export const SPOILER_STORAGE_KEY = "lotmSpoilerChapter";
const clamp = (value: number) => Math.max(1, Math.min(MAX_CHAPTER, Math.round(value || 1)));

export function useSpoilerChapter(defaultChapter = 1) {
  const [chapter, setChapter] = useState(clamp(defaultChapter));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = Number(params.get("spoiler"));
    const fromStorage = Number(window.localStorage.getItem(SPOILER_STORAGE_KEY));
    const resolved = Number.isFinite(fromUrl) && fromUrl >= 1 ? fromUrl : Number.isFinite(fromStorage) && fromStorage >= 1 ? fromStorage : defaultChapter;
    setChapter(clamp(resolved));

    const onChange = (event: Event) => {
      const custom = event as CustomEvent<number>;
      setChapter(clamp(custom.detail));
    };
    window.addEventListener("lotm-spoiler-change", onChange);
    return () => window.removeEventListener("lotm-spoiler-change", onChange);
  }, [defaultChapter]);

  const updateChapter = useCallback((next: number) => {
    const value = clamp(next);
    setChapter(value);
    window.localStorage.setItem(SPOILER_STORAGE_KEY, String(value));
    const url = new URL(window.location.href);
    url.searchParams.set("spoiler", String(value));
    window.history.replaceState({}, "", url);
    window.dispatchEvent(new CustomEvent("lotm-spoiler-change", { detail: value }));
  }, []);

  return [chapter, updateChapter] as const;
}
