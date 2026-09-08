import { Lieu } from "./types";

// Cette fonction doit accepter null, undefined ou un objet vide sans planter[cite: 2]
export function normaliserLieux(donneesBrutes: unknown): Lieu[] {
  // Ici, tu dois écrire la logique pour vérifier que donneesBrutes est un objet avec un tableau 'features'[cite: 1]
  // Si features est vide ([]), cela signifie qu'aucune localisation n'est trouvée[cite: 1]

  // Exemple simplifié (à typer correctement avec des type guards) :
  if (!donneesBrutes || typeof donneesBrutes !== "object") return [];
  const brutes = donneesBrutes as any;
  if (!Array.isArray(brutes.features)) return [];

  return brutes.features
    .map((feature: any) => ({
      id: feature.properties?.id ?? crypto.randomUUID(),
      libelle: feature.properties?.label ?? "Adresse inconnue",
      codeInsee: feature.properties?.citycode ?? "",
      codePostal: feature.properties?.postcode ?? null,
      commune: feature.properties?.city ?? "",
      coordonnees: feature.geometry?.coordinates
        ? {
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
          }
        : null,
    }))
    .filter((lieu: Lieu) => lieu.codeInsee !== "");
}
