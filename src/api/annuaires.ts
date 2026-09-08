export async function chercherOrganismesParCommune(
  codeInsee: string,
  signal: AbortSignal,
): Promise<unknown> {
  const codePropre = codeInsee.trim();

  // On repasse sur l'URL d'origine du sujet et on utilise URLSearchParams pour encoder proprement[cite: 1, 2]
  const params = new URLSearchParams({
    where: `code_insee_commune="${codePropre}"`,
    limit: "100", // Taille de page demandée[cite: 1]
    offset: "0",
    order_by: "id",
  });

  // Utilisation de l'ancienne adresse .fr et (si besoin) de l'identifiant long du jeu de données
  const url = `https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?${params.toString()}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  return response.json();
}
