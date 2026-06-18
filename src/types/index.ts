export interface GeneratedTrack {
  title: string;
  artist: string;
}

export interface EnrichedTrack extends GeneratedTrack {
  id: number;
  albumCover: string;
  previewUrl: string;
  deezerUrl: string;
  albumName: string;
  duration: number;
}

export interface Genre {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const GENRES: Genre[] = [
  { id: "any", name: "Any Genre", icon: "Music", description: "No preference" },
  { id: "pop", name: "Pop", icon: "Sparkles", description: "Chart-topping hits" },
  { id: "rock", name: "Rock", icon: "Guitar", description: "Electric riffs & drums" },
  { id: "electronic", name: "Electronic", icon: "Radio", description: "Synthesizers & beats" },
  { id: "hip-hop", name: "Hip-Hop", icon: "Mic", description: "Rhymes & flow" },
  { id: "jazz", name: "Jazz", icon: "Piano", description: "Swing & improvisation" },
  { id: "classical", name: "Classical", icon: "Music3", description: "Orchestral & timeless" },
  { id: "r&b", name: "R&B", icon: "Headphones", description: "Soulful vocals" },
  { id: "soul", name: "Soul", icon: "Heart", description: "Deep feeling" },
  { id: "reggae", name: "Reggae", icon: "Sun", description: "Island rhythms" },
  { id: "metal", name: "Metal", icon: "Zap", description: "Heavy & loud" },
  { id: "folk", name: "Folk", icon: "TreePine", description: "Acoustic storytelling" },
  { id: "latin", name: "Latin", icon: "Flame", description: "Passionate rhythms" },
  { id: "indie", name: "Indie", icon: "Sparkle", description: "Alternative & DIY" },
  { id: "lo-fi", name: "Lo-Fi", icon: "CloudMoon", description: "Chill & nostalgic" },
];

export const GENRE_ICONS: Record<string, string> = Object.fromEntries(
  GENRES.map((g) => [g.id, g.icon])
);
