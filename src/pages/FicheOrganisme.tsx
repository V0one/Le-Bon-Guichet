import { useEffect } from "react";
import { useParams } from "react-router";
import { NotFound } from "./NotFound";
import { useRecherche } from "../hooks/useRecherche";
import { lireAnnuaire, urlFiche } from "../api/annuaires";
import { lirePageAnnuaire, normaliserFiche } from "../domain/recherche";
import { Chargement } from "../components/Chargement";
import { EtatErreur } from "../components/EtatErreur";
import { HorairesOrganisme } from "../components/HorairesOrganisme";

export function FicheOrganisme() {
  const { id = "" } = useParams();
  const url = urlFiche(id);
  const { etat, relancer } = useRecherche(url, lireAnnuaire);
  const resultats =
    etat.statut === "succes" ? lirePageAnnuaire(etat.donnees).results : [];
  const organisme = resultats.length > 0 ? normaliserFiche(resultats[0]) : null;
  const titre =
    !url || (etat.statut === "succes" && !organisme)
      ? "Page introuvable"
      : organisme?.nom || "Fiche organisme";
  useEffect(() => {
    document.title = `${titre} - Le Bon Guichet`;
  }, [titre]);

  if (!url || (etat.statut === "succes" && !organisme)) return <NotFound />;
  if (etat.statut === "erreur")
    return <EtatErreur message={etat.message} onReessayer={relancer} />;
  if (!organisme)
    return etat.statut === "chargement" ? (
      <Chargement />
    ) : (
      <p>Préparation de la fiche…</p>
    );
  return (
    <>
      <h1>{organisme.nom}</h1>
      <h2>Coordonnées</h2>
      <h3>Adresse</h3>
      <p>{organisme.adresse}</p>
      <h3>Téléphone</h3>
      {organisme.telephones.length === 0 ? (
        <p>Numéro de téléphone non renseigné.</p>
      ) : (
        <ul>
          {organisme.telephones.map((telephone, index) => (
            <li key={index}>{telephone}</li>
          ))}
        </ul>
      )}
      <h3>Courriel</h3>
      <p>{organisme.courriel || "Courriel non renseigné."}</p>
      <HorairesOrganisme horaires={organisme.horaires} />
      <section className="fr-callout" aria-labelledby="accessibilite-titre">
        <h2 id="accessibilite-titre">Accessibilité physique</h2>
        {organisme.accessibilite.length === 0 ? (
          <p>Accessibilité physique non renseignée. Contactez le guichet pour préparer votre venue.</p>
        ) : organisme.accessibilite.map((adresse, index) => (
          <div key={index}>
            <h3>{adresse.libelle || adresse.type || "Lieu d’accueil"}</h3>
            <p>{adresse.description || "Accessibilité physique non renseignée."}</p>
            {adresse.note && <p>{adresse.note}</p>}
          </div>
        ))}
      </section>
      {organisme.source && (
        <p>
          <a href={organisme.source} target="_blank" rel="noreferrer">
            Consulter la fiche officielle, les horaires et les informations
            d’accessibilité (nouvelle fenêtre)
          </a>
        </p>
      )}
    </>
  );
}
