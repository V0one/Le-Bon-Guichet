export function filtrerOrganismesParType(
  resultatsBruts: any[],
  typeRecherche: string,
): any[] {
  if (!Array.isArray(resultatsBruts)) return [];

  return resultatsBruts.filter((org) => {
    if (!org.pivot) return false;

    try {
      // Le champ pivot est une chaîne JSON qu'il faut décoder[cite: 1]
      const pivotsDecodes = JSON.parse(org.pivot);

      // On vérifie si l'un des objets du tableau contient le bon type_service_local[cite: 1]
      return pivotsDecodes.some(
        (p: any) => p.type_service_local === typeRecherche,
      );
    } catch (e) {
      // En cas de JSON malformé, on ignore cet organisme pour ne pas planter l'application[cite: 1]
      return false;
    }
  });
}
