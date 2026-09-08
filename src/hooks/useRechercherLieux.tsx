import { useState, useEffect } from "react";
import { chercherLieux } from "../api/geoplateforme";
import { normaliserLieux } from "../domain/lieux";
import { EtatRecherche, Lieu } from "../domain/types";

export function useRechercheLieu(saisie: string) {
  const [etat, setEtat] = useState<EtatRecherche<Lieu>>({ statut: "initial" });

  useEffect(() => {
    if (!saisie.trim()) {
      setEtat({ statut: "initial" });
      return;
    }

    const abortController = new AbortController();

    // Délai de 300ms avant de lancer la requête[cite: 1]
    const timeoutId = setTimeout(async () => {
      setEtat({ statut: "chargement" }); // Aucun spinner avant ce délai[cite: 2]

      try {
        const donneesBrutes = await chercherLieux(
          saisie,
          abortController.signal,
        );
        const lieux = normaliserLieux(donneesBrutes);

        if (lieux.length === 0) {
          setEtat({ statut: "vide" });
        } else {
          setEtat({ statut: "succes", resultats: lieux, total: lieux.length });
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        setEtat({
          statut: "erreur",
          message: "Impossible de joindre le service.",
        });
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [saisie]);

  return etat;
}
