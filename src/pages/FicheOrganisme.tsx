import { useEffect } from "react";
import { useParams } from "react-router";
import { NotFound } from "./NotFound";
import { useRecherche } from "../hooks/useRecherche";
import { lireAnnuaire, urlFiche } from "../api/annuaires";
import { lirePageAnnuaire, normaliserFiche } from "../domain/recherche";
import { Chargement } from "../components/Chargement";
import { EtatErreur } from "../components/EtatErreur";

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
      {organisme.source && (
        <p>
          <a href={organisme.source} target="_blank" rel="noreferrer">
            Consulter la fiche officielle, les horaires et les informations
            d’accessibilité
          </a>
        </p>
      )}
    </>
  );
}
