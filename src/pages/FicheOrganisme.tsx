import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { NotFound } from "./NotFound";

export function FicheOrganisme() {
  const { id } = useParams<{ id: string }>();
  const [etat, setEtat] = useState<
    "chargement" | "erreur" | "succes" | "introuvable"
  >("chargement");
  const [organisme, setOrganisme] = useState<any>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function chargerOrganisme() {
      try {
        setEtat("chargement");
        // Le titre de l'onglet doit changer selon la page[cite: 2]
        document.title = "Chargement... - Le Bon Guichet";

        // Appel de la vraie API avec filtrage par identifiant métier[cite: 1]
        const url = `https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?where=id="${id}"&limit=1`;
        const response = await fetch(url, { signal: abortController.signal });

        if (!response.ok) throw new Error("Erreur réseau");

        const data = await response.json();

        // Un ID inexistant doit afficher une page 404, pas d'écran blanc
        if (
          data.total_count === 0 ||
          !data.results ||
          data.results.length === 0
        ) {
          setEtat("introuvable");
          document.title = "Page introuvable - Le Bon Guichet";
        } else {
          setOrganisme(data.results[0]);
          setEtat("succes");
          document.title = `${data.results[0].nom} - Le Bon Guichet`;
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        setEtat("erreur");
        document.title = "Erreur - Le Bon Guichet";
      }
    }

    if (id) chargerOrganisme();

    return () => abortController.abort();
  }, [id]);

  if (etat === "introuvable") {
    return <NotFound />;
  }

  if (etat === "erreur") {
    return (
      <div className="fr-container fr-py-4w">
        <div className="fr-alert fr-alert--error">
          <h3 className="fr-alert__title">Erreur API</h3>
          <p>
            Impossible de récupérer les informations de cet organisme. Veuillez
            réessayer.
          </p>
        </div>
      </div>
    );
  }

  if (etat === "chargement") {
    return (
      <div className="fr-container fr-py-4w">
        <p role="status">Chargement de la fiche en cours...</p>
      </div>
    );
  }

  // --- TRAITEMENT DES DONNÉES MANQUANTES OU ENCODÉES (US C2) ---

  // Les adresses et téléphones sont souvent des chaînes JSON qu'il faut décoder[cite: 1]
  let adressesDecodees = [];
  try {
    if (organisme?.adresse) adressesDecodees = JSON.parse(organisme.adresse);
  } catch (e) {
    console.error("Impossible de décoder l'adresse");
  }

  let telephonesDecodes = [];
  try {
    if (organisme?.telephone)
      telephonesDecodes = JSON.parse(organisme.telephone);
  } catch (e) {
    console.error("Impossible de décoder le téléphone");
  }

  // Distinguer l'adresse physique en priorité[cite: 1]
  const adressePhysique =
    adressesDecodees.find((a: any) => a.type_adresse === "Adresse") ||
    adressesDecodees[0];

  return (
    <div className="fr-container fr-py-4w">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <h1 className="fr-h1">{organisme?.nom}</h1>

          <div className="fr-mb-4w">
            {/* L'indicateur d'ouverture est attendu, ici statique en attendant le moteur de calcul métier[cite: 2] */}
            <Badge severity="info">Horaires non renseignés / à confirmer</Badge>
          </div>

          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-6">
              <div className="fr-card fr-card--no-border">
                <div className="fr-card__body">
                  <h3 className="fr-card__title">Coordonnées</h3>
                  <div className="fr-card__desc">
                    <p className="fr-text--bold fr-mb-1w">Adresse :</p>
                    {/* Gestion explicite si l'adresse manque, pas de undefined[cite: 2] */}
                    {adressePhysique ? (
                      <address>
                        {adressePhysique.numero_voie &&
                          `${adressePhysique.numero_voie} `}
                        {adressePhysique.nom_voie}
                        <br />
                        {adressePhysique.code_postal}{" "}
                        {adressePhysique.nom_commune}
                      </address>
                    ) : (
                      <p>Adresse physique non renseignée.</p>
                    )}

                    <p className="fr-text--bold fr-mt-2w fr-mb-1w">
                      Téléphone :
                    </p>
                    {telephonesDecodes.length > 0 &&
                    telephonesDecodes[0].valeur ? (
                      <p>
                        <a
                          href={`tel:${telephonesDecodes[0].valeur.replace(/\s/g, "")}`}
                        >
                          {telephonesDecodes[0].valeur}
                        </a>
                      </p>
                    ) : (
                      <p>Numéro de téléphone non renseigné.</p>
                    )}

                    <p className="fr-text--bold fr-mt-2w fr-mb-1w">Email :</p>
                    {organisme?.adresse_courriel ? (
                      <p>
                        <a href={`mailto:${organisme.adresse_courriel}`}>
                          {organisme.adresse_courriel}
                        </a>
                      </p>
                    ) : (
                      <p>Email non renseigné.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="fr-col-12 fr-col-md-6">
              <div className="fr-card fr-card--no-border">
                <div className="fr-card__body">
                  <h3 className="fr-card__title">Accessibilité & Horaires</h3>
                  <div className="fr-card__desc">
                    {/* Affichage par défaut exigé quand l'info manque[cite: 1] */}
                    <p>Accessibilité physique non renseignée</p>
                    <p className="fr-mt-2w">
                      <em>
                        Les horaires détaillés nécessitent le traitement métier
                        (US C).
                      </em>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
