export interface Coordonnees {
  longitude: number;
  latitude: number;
}

// Représentation métier d'un lieu, décorrélée du GeoJSON[cite: 1]
export interface Lieu {
  id: string;
  libelle: string;
  codeInsee: string;
  codePostal: string | null;
  commune: string;
  coordonnees: Coordonnees | null;
}

export type EtatRecherche<T> =
  | { statut: "initial" }
  | { statut: "chargement" }
  | { statut: "succes"; resultats: T[]; total: number }
  | { statut: "vide" }
  | { statut: "erreur"; message: string };
