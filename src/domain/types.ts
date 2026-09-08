export interface Coordonnees {
  longitude: number;
  latitude: number;
}

// Représentation métier d'un lieu, indépendante du GeoJSON.
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
