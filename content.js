/**
 * LinkedOut - content.js
 *
 * Seule responsabilité : DÉTECTER les cartes "Suggestions" du feed LinkedIn
 * par leur libellé texte exact, et les marquer avec une classe CSS. Tout le
 * masquage effectif est délégué à styles.css via cette classe.
 *
 * Pourquoi JS + MutationObserver plutôt que du CSS pur ? Le feed LinkedIn
 * est rendu dynamiquement en React et les cartes "Suggestions" n'ont aucun
 * attribut/classe stable signifiant "ceci est une suggestion" — seul un
 * petit libellé texte ("Suggestions") au-dessus de la carte permet de les
 * identifier, et ça ne peut se lire qu'à l'exécution.
 */
(() => {
  'use strict';

  // Texte exact (après trim) recherché. Volontairement strict : pas de
  // variante ("Suggéré", "Recommandé", etc.) pour éviter tout faux positif.
  const SUGGESTIONS_LABEL = 'Suggestions';

  // Marqueur de "carte déjà inspectée". Un attribut, pas une classe : il ne
  // porte aucun sens visuel et styles.css ne le référence jamais. Il sert
  // uniquement à ce que le scan suivant (déclenché très souvent par
  // l'activité normale du feed) ne re-parcoure pas le sous-arbre de chaque
  // post déjà classé.
  const CHECKED_ATTR = 'data-linkedout-checked';

  // Seul marqueur visuel. styles.css possède l'unique règle `display: none`
  // qui lui est attachée.
  const HIDDEN_CLASS = 'linkedout-hidden';

  // Conteneur sémantique du feed principal. N'existe que sur les pages qui
  // affichent un feed (accueil) ; absent ailleurs (profil, messagerie...).
  // Un `data-testid` est en général plus stable dans le temps que les
  // classes hashées de LinkedIn (souvent un hook de test interne).
  const FEED_CONTAINER_SELECTOR = '[data-testid="mainFeed"]';

  // Rôle ARIA porté par chaque carte du feed (post normal, suggestion, pub...).
  // Choisi comme ancre plutôt qu'une classe hashée ou l'attribut interne
  // `componentkey`, tous deux instables d'une release LinkedIn à l'autre.
  const CARD_SELECTOR = `[role="listitem"]:not([${CHECKED_ATTR}])`;

  function isSuggestionsCard(card) {
    for (const p of card.querySelectorAll('p')) {
      if (p.textContent.trim() === SUGGESTIONS_LABEL) {
        return true;
      }
    }
    return false;
  }

  function scanForSuggestions() {
    // Résolu à chaque scan, jamais mis en cache : LinkedIn est une SPA et
    // peut démonter/remonter le conteneur du feed (ex. navigation vers un
    // profil puis retour à l'accueil) sans rechargement complet de page.
    const root = document.querySelector(FEED_CONTAINER_SELECTOR) || document;

    root.querySelectorAll(CARD_SELECTOR).forEach((card) => {
      card.setAttribute(CHECKED_ATTR, '');
      if (isSuggestionsCard(card)) {
        card.classList.add(HIDDEN_CLASS);
      }
    });
  }

  // Regroupe les rafales de mutations (le feed LinkedIn en génère beaucoup :
  // scroll infini, compteurs, lazy loading...) en un seul scan par frame,
  // plutôt qu'un scan par callback du MutationObserver.
  let scanScheduled = false;
  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      scanForSuggestions();
    });
  }

  function start() {
    scheduleScan();

    // On n'observe QUE childList/subtree (apparition/disparition de nœuds).
    // `attributes` est volontairement omis : nos propres écritures
    // (setAttribute/classList.add ci-dessus) sont des mutations d'attribut,
    // donc avec `attributes` désactivé elles ne peuvent jamais redéclencher
    // cet observer — pas de boucle de rétroaction possible.
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.body) {
    start();
  } else {
    // Filet de sécurité : avec le run_at par défaut ("document_idle"),
    // document.body existe déjà à ce stade, mais ce garde-fou ne coûte rien.
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
