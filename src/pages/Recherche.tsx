import { useState } from "react";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { useRechercheLieu } from "../hooks/useRechercherLieux";
import { chercherOrganismesParCommune } from "../api/annuaires";
import { filtrerOrganismesParType } from "../domain/recherche";

export function Recherche() {
  const [typeRecherche, setTypeRecherche] = useState("mairie"); // Type par défaut[cite: 1]
  const [saisie, setSaisie] = useState("");
  const etatRecherche = useRechercheLieu(saisie);

  // Nouveaux états pour gérer les résultats finaux de l'Annuaire
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [chargementAnnuaire, setChargementAnnuaire] = useState(false);

  // Fonction déclenchée quand on clique sur une ville
  const handleSelectionLieu = async (codeInsee: string) => {
    setChargementAnnuaire(true);
    try {
      const controller = new AbortController();
      const data = (await chercherOrganismesParCommune(
        codeInsee,
        controller.signal,
      )) as any;

      // Appel de la fonction du domaine, React ne fait plus de logique métier[cite: 2]
      const resultatsFiltres = filtrerOrganismesParType(
        data.results || [],
        typeRecherche,
      );

      setOrganismes(resultatsFiltres);
    } catch (error) {
      console.error(error);
    } finally {
      setChargementAnnuaire(false);
    }
  };

  return (
    <div className="fr-container fr-py-4w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          {/* Nouveau champ : Type d'organisme */}
          <Select
            label="Que recherchez-vous ?"
            nativeSelectProps={{
              value: typeRecherche,
              onChange: (e) => setTypeRecherche(e.target.value),
            }}
          >
            <option value="mairie">Mairie</option>
            <option value="caf">CAF</option>
            <option value="cpam">CPAM</option>
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          {/* Ton champ existant pour le lieu */}
          <Input
            label="Saisissez une commune ou un code postal"
            nativeInputProps={{
              value: saisie,
              onChange: (e) => setSaisie(e.target.value),
            }}
          />
        </div>
      </div>

      <div className="fr-mt-4w">
        {/* Affichage des propositions de villes (ce que tu avais déjà) */}
        {etatRecherche.statut === "succes" && (
          <ul className="fr-tags-group">
            {etatRecherche.resultats.map((lieu) => (
              <li key={lieu.id}>
                <button
                  className="fr-tag"
                  onClick={() => handleSelectionLieu(lieu.codeInsee)}
                >
                  {lieu.libelle}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* NOUVEAU : Affichage des guichets finaux (La liste de résultats de l'US A1) */}
        {chargementAnnuaire && <p>Recherche des guichets en cours...</p>}

        {organismes.length > 0 && (
          <div className="fr-mt-4w">
            <h2>{organismes.length} organisme(s) trouvé(s)</h2>
            <ul className="fr-grid-row fr-grid-row--gutters list-unstyled">
              {organismes.map((org) => (
                <li key={org.id} className="fr-col-12 fr-col-md-6">
                  <div className="fr-card fr-enlarge-link">
                    <div className="fr-card__body">
                      <div className="fr-card__content">
                        <h3 className="fr-card__title">
                          <a href={`/organismes/${org.id}`}>{org.nom}</a>
                        </h3>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
