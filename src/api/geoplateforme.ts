export async function chercherLieux(
  saisie: string,
  signal: AbortSignal,
): Promise<unknown> {
  const params = new URLSearchParams({
    q: saisie,
    limit: "5",
  });

  const url = `https://data.geopf.fr/geocodage/search/?${params.toString()}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  return response.json();
}
