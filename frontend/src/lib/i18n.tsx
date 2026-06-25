"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "en" | "fr";

const translations = {
  en: {
    title: "Playlist Generator",
    landing_title_1: "Turn any text",
    landing_title_2: "into a playlist",
    landing_subtitle: "Describe a vibe or moment, select a genre, and let AI craft your perfect tracklist.",
    placeholder: "Describe your mood, location, or activity...",
    genre_any: "Any Genre",
    genre_rock: "Rock",
    genre_pop: "Pop",
    genre_hiphop: "Hip Hop",
    genre_electronic: "Electronic",
    genre_jazz: "Jazz",
    genre_classical: "Classical",
    genre_metal: "Metal",
    genre_reggae: "Reggae",
    genre_french: "French Variety",
    genre_hyperpop: "Hyperpop",
    genre_lofi: "Lofi",
    genre_rap: "Rap",
    genre_rb: "R&B",
    genre_soul: "Soul",
    genre_folk: "Folk",
    genre_latin: "Latin",
    genre_indie: "Indie",
    generate: "Generate",
    generating: "Generating",
    new_playlist: "New Playlist",
    tracks: "tracks",
    play_preview: "Play Preview",
    pause_preview: "Pause Preview",
    add_to_deezer: "Add to Deezer",
    select_all: "Select all",
    track_col: "Track",
    album_col: "Album",
    duration_col: "Duration",
    select_genre: "Select a genre",
    generation_failed: "Generation failed. Please try again.",
    rate_limit_exceeded: "Rate limit exceeded. Maximum 10 generations per hour.",
    duration_hour: "hr",
    duration_min: "min",
    open_on_deezer: "Open on Deezer",
    preview_playlist: "Preview Playlist",
    workspace_label: "PLAYLIST STUDIO",
    inspiration_title: "INSPIRATION IDEAS",
    empty_workspace_title: "Your Curation Studio",
    empty_workspace_desc: "Describe your target mood or genre on the left to start designing your custom playlist.",
    delete_track: "Delete track",
    history_title: "YOUR HISTORY",
    history_empty: "No saved playlists yet.",
    clear_history: "Clear history",
    move_up: "Move up",
    move_down: "Move down",
  },
  fr: {
    title: "Générateur de Playlist",
    landing_title_1: "Transformez vos pensées",
    landing_title_2: "en playlist",
    landing_subtitle: "Décrivez une ambiance ou un moment, sélectionnez un genre, et laissez l'IA concevoir votre tracklist idéale.",
    placeholder: "Décrivez votre humeur, lieu ou activité...",
    genre_any: "Tous les genres",
    genre_rock: "Rock",
    genre_pop: "Pop",
    genre_hiphop: "Hip Hop",
    genre_electronic: "Électronique",
    genre_jazz: "Jazz",
    genre_classical: "Classique",
    genre_metal: "Métal",
    genre_reggae: "Reggae",
    genre_french: "Variété française",
    genre_hyperpop: "Hyperpop",
    genre_lofi: "Lofi",
    genre_rap: "Rap",
    genre_rb: "R&B",
    genre_soul: "Soul",
    genre_folk: "Folk",
    genre_latin: "Musique latine",
    genre_indie: "Indie / Alternatif",
    generate: "Générer",
    generating: "Génération",
    new_playlist: "Nouvelle Playlist",
    tracks: "titres",
    play_preview: "Écouter l'extrait",
    pause_preview: "Pause",
    add_to_deezer: "Ajouter à Deezer",
    select_all: "Tout sélectionner",
    track_col: "Titre",
    album_col: "Album",
    duration_col: "Durée",
    select_genre: "Sélectionner un genre",
    generation_failed: "La génération a échoué. Veuillez réessayer.",
    rate_limit_exceeded: "Limite de requêtes dépassée. Maximum 10 générations par heure.",
    duration_hour: "h",
    duration_min: "min",
    open_on_deezer: "Ouvrir sur Deezer",
    preview_playlist: "Écouter la playlist",
    workspace_label: "STUDIO DE CURATION",
    inspiration_title: "IDÉES D'INSPIRATION",
    empty_workspace_title: "Votre studio de curation",
    empty_workspace_desc: "Décrivez l'ambiance musicale recherchée sur la gauche pour concevoir votre sélection personnalisée.",
    delete_track: "Supprimer le titre",
    history_title: "VOTRE HISTORIQUE",
    history_empty: "Aucune playlist enregistrée.",
    clear_history: "Effacer l'historique",
    move_up: "Monter le titre",
    move_down: "Descendre le titre",
  },
};

export type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("deezer_locale") as Locale;
    if (saved === "en" || saved === "fr") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "en" || browserLang === "fr") {
        setLocaleState(browserLang as Locale);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("deezer_locale", newLocale);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale]?.[key] || translations["en"]?.[key] || String(key);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
