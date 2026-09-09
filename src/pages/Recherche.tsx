import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { useRechercheLieu } from "../hooks/useRechercherLieux";
import { useRecherche } from "../hooks/useRecherche";
import { lireAnnuaire, urlOrganismes } from "../api/annuaires";
import {
  filtrerOrganismesParType,
  lirePageAnnuaire,
} from "../domain/recherche";
import { normaliserLieux } from "../domain/lieux";
import type { Lieu } from "../domain/types";
import { lireLieuRecherche, ecrireRechercheUrl } from "../domain/rechercheUrl";
import { Introduction, LONGUEUR_MINIMALE } from "../components/Introduction";
import { Chargement } from "../components/Chargement";
import { EtatErreur } from "../components/EtatErreur";
import { EtatVide } from "../components/EtatVide";
import "./Recherche.css";

export function Recherche() {
  const [parametres, setParametres] = useSearchParams();
  const chaineParametres = parametres.toString();
  const typeInitial = parametres.get("type");
  const saisieInitiale = parametres.get("lieu") ?? "";
  const [type, setType] = useState(
    typeInitial === "caf" || typeInitial === "cpam" ? typeInitial : "mairie",
  );
  const [saisie, setSaisie] = useState(saisieInitiale);
  const [lieu, setLieu] = useState<Lieu | null>(() => lireLieuRecherche(parametres));
  const geo = useRechercheLieu(lieu ? "" : saisie);
  const annuaire = useRecherche(
    lieu ? urlOrganismes(lieu.codeInsee) : null,
    lireAnnuaire,
  );
  const localisation = useRef<HTMLInputElement>(null);
  const resultats = useRef<HTMLElement>(null);
  const [focaliserResultats, setFocaliserResultats] = useState(false);

  useEffect(() => {
    document.title = "Recherche - Le Bon Guichet";
  }, []);

  useEffect(() => {
    const typeParametre = parametres.get("type");
    const prochainType =
      typeParametre === "caf" || typeParametre === "cpam" ? typeParametre : "mairie";
    const prochaineSaisie = parametres.get("lieu") ?? "";
    setType(prochainType);
    setSaisie(prochaineSaisie);
    setLieu(lireLieuRecherche(parametres));
  }, [chaineParametres]);

  function changerSaisie(valeur: string) {
    geo.annuler();
    annuaire.annuler();
    setLieu(null);
    setSaisie(valeur);
  }

  function reinitialiser() {
    changerSaisie("");
    setParametres({});
    localisation.current?.focus();
  }

  const etat = lieu ? annuaire.etat : geo.etat;

  /* US D1 : l'action qui fait disparaître son propre bouton rend le focus à la région de résultats. */
  useEffect(() => {
    if (
      !focaliserResultats ||
      etat.statut === "chargement" ||
      etat.statut === "attente"
    )
      return;
    resultats.current?.focus();
    setFocaliserResultats(false);
  }, [focaliserResultats, etat.statut]);

  const lieux =
    geo.etat.statut === "succes" ? normaliserLieux(geo.etat.donnees) : [];
  const organismes =
    annuaire.etat.statut === "succes"
      ? filtrerOrganismesParType(
          lirePageAnnuaire(annuaire.etat.donnees).results,
          type,
        )
      : [];

  return (
    <>
      <h1>Le Bon Guichet</h1>
      <p>
        Trouvez les administrations implantées dans une commune et leurs
        coordonnées.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setParametres(ecrireRechercheUrl(type, saisie, lieu));
          (lieu ? annuaire : geo).relancer();
        }}
      >
        <Select
          label="Type d’organisme"
          nativeSelectProps={{
            value: type,
            onChange: (event) => {
              setType(event.target.value);
              if (lieu) setParametres(ecrireRechercheUrl(event.target.value, saisie, lieu));
            },
          }}
        >
          <option value="mairie">Mairie</option>
          <option value="caf">CAF</option>
          <option value="cpam">CPAM</option>
        </Select>
        <Input
          label="Localisation"
          hintText="Commune ou code postal, 2 caractères minimum. Exemple : Amiens ou 80000."
          nativeInputProps={{
            ref: localisation,
            value: saisie,
            onChange: (event) => changerSaisie(event.target.value),
            autoComplete: "off",
          }}
        />
        <Button
          type="submit"
          disabled={saisie.trim().length < LONGUEUR_MINIMALE}
        >
          Rechercher
        </Button>
      </form>

      {lieu && <p>Commune sélectionnée : {lieu.libelle}</p>}

      <div className="recherche-chargement">
        <Chargement actif={etat.statut === "chargement"} />
      </div>

      {/* Zone de hauteur stable, défilable au clavier. L'annonce reste hors aria-busy. */}
      <section
        ref={resultats}
        tabIndex={0}
        aria-label="Résultats de la recherche"
        className="fr-mt-4w recherche-resultats"
        aria-live="polite"
        aria-busy={etat.statut === "chargement"}
      >
        {(etat.statut === "initial" || etat.statut === "attente") && (
          <Introduction />
        )}
        {etat.statut === "erreur" && (
          <EtatErreur
            message={etat.message}
            onReessayer={() => {
              (lieu ? annuaire : geo).relancer();
              setFocaliserResultats(true);
            }}
          />
        )}

        {!lieu &&
          etat.statut === "succes" &&
          (lieux.length === 0 ? (
            <EtatVide
              nature="lieu"
              localisation={saisie.trim()}
              onReinitialiser={reinitialiser}
            />
          ) : (
            <>
              <h2>Sélectionnez un lieu</h2>
              <ul>
                {lieux.map((proposition) => (
                  <li key={proposition.id}>
                    <Button
                      priority="tertiary no outline"
                      onClick={() => {
                        geo.annuler();
                        setLieu(proposition);
                        setParametres(ecrireRechercheUrl(type, saisie, proposition));
                        setFocaliserResultats(true);
                      }}
                    >
                      {proposition.libelle}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          ))}

        {lieu &&
          etat.statut === "succes" &&
          (organismes.length === 0 ? (
            <EtatVide
              localisation={lieu.commune}
              onReinitialiser={reinitialiser}
            />
          ) : (
            <>
              <h2>
                {organismes.length} organisme{organismes.length > 1 ? "s" : ""}{" "}
                trouvé{organismes.length > 1 ? "s" : ""}
              </h2>
              <ul className="fr-grid-row fr-grid-row--gutters">
                {organismes.map((organisme) => (
                  <li className="fr-col-12 fr-col-md-6" key={organisme.id}>
                    <Card
                      title={organisme.nom}
                      titleAs="h3"
                      desc={organisme.adresse}
                      linkProps={{
                        to: `/organismes/${encodeURIComponent(organisme.id)}`,
                      }}
                      enlargeLink
                    />
                  </li>
                ))}
              </ul>
            </>
          ))}
      </section>
    </>
  );
}
