import { useEffect, useState } from "react";
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
import { Introduction, LONGUEUR_MINIMALE } from "../components/Introduction";
import { Chargement } from "../components/Chargement";
import { EtatErreur } from "../components/EtatErreur";
import { EtatVide } from "../components/EtatVide";

export function Recherche() {
  const [type, setType] = useState("mairie");
  const [saisie, setSaisie] = useState("");
  const [lieu, setLieu] = useState<Lieu | null>(null);
  const geo = useRechercheLieu(lieu ? "" : saisie);
  const annuaire = useRecherche(
    lieu ? urlOrganismes(lieu.codeInsee) : null,
    lireAnnuaire,
  );

  useEffect(() => {
    document.title = "Recherche - Le Bon Guichet";
  }, []);

  function changerSaisie(valeur: string) {
    geo.annuler();
    annuaire.annuler();
    setLieu(null);
    setSaisie(valeur);
  }

  const etat = lieu ? annuaire.etat : geo.etat;
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
          (lieu ? annuaire : geo).relancer();
        }}
      >
        <Select
          label="Type d’organisme"
          nativeSelectProps={{
            value: type,
            onChange: (event) => setType(event.target.value),
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

      {/* Ajout de la hauteur minimale (60vh) pour empêcher le layout shift */}
      <section
        className="fr-mt-4w"
        style={{ minHeight: "60vh" }}
        aria-live="polite"
        aria-busy={etat.statut === "chargement"}
      >
        {(etat.statut === "initial" || etat.statut === "attente") && (
          <Introduction />
        )}
        {etat.statut === "chargement" && <Chargement />}
        {etat.statut === "erreur" && (
          <EtatErreur
            message={etat.message}
            onReessayer={(lieu ? annuaire : geo).relancer}
          />
        )}

        {!lieu &&
          etat.statut === "succes" &&
          (lieux.length === 0 ? (
            <EtatVide
              nature="lieu"
              localisation={saisie.trim()}
              onReinitialiser={() => changerSaisie("")}
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
              onReinitialiser={() => changerSaisie("")}
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
