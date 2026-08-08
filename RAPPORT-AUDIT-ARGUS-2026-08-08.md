# Rapport d'audit — simulateur douane véhicules AD TRANS LOGISTICS

**Date de l'audit :** 8 août 2026

**Source de cote principale :** *L'argus*, n° 4616 du 29 juin 2022

**Périmètre :** véhicules d'occasion, calcul des droits et taxes, rapprochements Argus, liquidations SAD 2023–2026 et traçabilité destinée au contrôle douanier.

## 1. Conclusion opérationnelle

Le moteur de liquidation est globalement bien calibré sur les déclarations SAD disponibles. Le défaut majeur concernait la preuve de la valeur véhicule : le simulateur affichait une cote sans indiquer précisément le véhicule Argus rapproché, la page et la ligne utilisées. Il extrapolait aussi les années postérieures au dernier millésime connu par une hausse automatique de 8 % par an, méthode non justifiable par l'édition 4616.

La mise à jour corrige ces deux points :

- chaque rapprochement disponible expose l'édition, la page imprimée, la page PDF et les identifiants des lignes Argus ;
- les rapprochements sont classés **vérifiés**, **recoupés**, **indicatifs** ou **à vérifier** ;
- les millésimes 2022 et suivants utilisent obligatoirement une valeur facture/AVD ;
- aucune valeur Argus n'est inventée lorsque la source ne permet pas un rapprochement fiable ;
- le rapport PDF et le devis reprennent désormais la traçabilité de la valeur.

## 2. Historique des dernières mises à jour retrouvées

| Date | Mise à jour | État constaté |
|---|---|---|
| 2 juillet 2026 | Référentiel réel et moteur de liquidation | 2 253 combinaisons marque/modèle/année intégrées |
| 11 juillet 2026 | Dépréciation 80 % / 60 % / 40 %, corrections GLK350 et Mazda 3/5/6 | Présent dans le code actuel |
| 13 juillet 2026 | Assimilations douanières documentées | Présentes dans le code actuel |
| 13 juillet 2026 | Formulaire de coordonnées avant résultat | Présent dans la version actuelle |
| 8 août 2026 | Traçabilité Argus 4616 et suppression de l'extrapolation post-2021 | Réalisé dans cette mise à jour |

## 3. Sources analysées

### Argus 4616

- PDF scanné de 69 pages, sans couche texte exploitable directement.
- Pagination imprimée observée : pages 64 à 133.
- Pages imprimées 122 et 123 absentes du PDF fourni.
- Extraction contrôlée : **19 162 variantes**, dont **19 145 avec un prix**.
- Lignes jugées fiables : **14 492** (`VALIDE_RAPID` ou `VALIDE_CONSENSUS`).
- Lignes restant à contrôler : **4 670** (`A_VERIFIER`).
- Couverture fiable regroupée : **6 025 familles marque/modèle/année**, 47 marques, millésimes 2008 à 2021.

### Données SAD et compilations

- `COMPIL SAD.xlsx` : 26 361 lignes, données jusqu'au 2 juillet 2026.
- `COMPIL DEDOUANEMENT (1).xlsx` : 5 135 lignes 2023–2026, dont 4 671 véhicules d'occasion ; dernière liquidation observée le 19 mars 2026.
- Le second classeur complète certaines références, mais n'est pas chronologiquement plus récent que `COMPIL SAD.xlsx`.
- **4 549 liquidations sur 4 671**, soit environ **97,4 %**, concordent à ±3 FCFA avec l'une des quatre catégories fiscales reconstruites.

## 4. Formule de liquidation reconstruite

1. Valeur véhicule en FCFA = cote retenue en euros × 655,957.
2. Valeur CAF = valeur véhicule + fret forfaitaire de la zone.
3. Assiette taxable = 70 % de la valeur CAF.
4. Droit de douane : 20 % pour les catégories A/B, 10 % pour C, 5 % pour D.
5. Prélèvements communautaires : 3 % de l'assiette.
6. TVA : 18 % de l'assiette augmentée du droit de douane et des prélèvements.
7. Accise : 10 % de la même base pour les véhicules de tourisme concernés par le seuil de puissance/cylindrée.
8. Taxes et redevances fixes : 98 600 FCFA.
9. Réexportation EX8 : forfait douanier de 305 000 FCFA.

Planchers CAF appliqués par le simulateur : 1 500 000 FCFA pour les véhicules légers et 2 500 000 FCFA pour les camions/tracteurs/semi-remorques.

## 5. Règle Argus appliquée

- Millésime présent dans l'Argus : cote de version concordante ou moyenne de la cote basse et de la cote haute documentées.
- Millésime antérieur au premier millésime disponible : 80 % à −1 an, 60 % à −2 ans, 40 % à −3 ans et au-delà.
- Millésime 2022 ou ultérieur : valeur transactionnelle justifiée par facture/AVD ; aucune hausse automatique de la cote 2021.
- Assimilation : le véhicule source et son équivalent Argus sont affichés explicitement.

Exemples contrôlés visuellement :

| Véhicule simulé | Référence Argus | Calcul | Page |
|---|---|---:|---|
| Toyota RAV 2013 | Toyota RAV4 2013 | (6 850 + 8 850) / 2 = **7 850 €** | imprimée 103 / PDF 29 |
| Toyota Corolla Verso 2008 | Corolla Verso 2008 | (2 260 + 2 770) / 2 = **2 515 €** | imprimée 121 / PDF 11 |
| Lexus RX350 2011 | Lexus RX 2011 | (9 100 + 10 800) / 2 = **9 950 €** | imprimée 109 / PDF 23 |
| Toyota Highlander 2005 | Land Cruiser 2008 | 5 900 × 40 % = **2 360 €** | imprimée 121 / PDF 11 |

## 6. Couverture de traçabilité intégrée

Le fichier généré contient :

- **461 familles Argus** exploitables ;
- **1 365 liens** entre les libellés du simulateur et les familles Argus ;
- **512 preuves ciblées** pour les combinaisons du référentiel actuel :
  - 204 vérifiées directement ;
  - 40 recoupées avec la cote empirique mais nécessitant un contrôle visuel de la ligne OCR ;
  - 268 rapprochements indicatifs, faute de version exacte ou de concordance de prix parfaite.

La mention « vérifiée » ne doit être utilisée que lorsque la valeur conservée est retrouvée directement dans une ligne fiable ou dans une moyenne de lignes fiables. Les autres résultats restent clairement signalés à l'utilisateur et dans le PDF.

## 7. Limites et contrôles humains nécessaires

- Le formulaire ne demande pas encore la finition, la motorisation, la boîte et le nombre de portes. Lorsqu'il existe plusieurs versions, la moyenne basse/haute ne constitue pas la cote exacte d'une finition précise.
- Les pages imprimées 122 et 123 ne figurent pas dans le PDF fourni ; les millésimes concernés doivent être contrôlés avec un exemplaire complet de l'édition.
- Les lignes `A_VERIFIER` ne sont jamais présentées comme vérifiées : elles portent le statut « recoupée » et une alerte de contrôle visuel.
- Les véhicules gravement accidentés, neufs, hors série ou à valeur receveur nécessitent une instruction séparée.
- Le montant final reste soumis au code SH, aux caractéristiques réelles du véhicule, aux pièces du dossier et à la décision de l'inspecteur vérificateur.

## 8. Fichiers techniques produits

- `argus_4616_reference.js` : référentiel généré pour l'interface.
- `tools/generate_argus_4616_reference.py` : génération reproductible depuis le classeur d'extraction.
- `tools/test_argus_4616_reference.js` : contrôles de données, exemples Argus, syntaxe et absence d'extrapolation +8 %.

## 9. Tests effectués

- génération reproductible : 461 familles, 1 365 liens, 512 traces ;
- compilation syntaxique de tous les scripts intégrés à la page ;
- test RAV 2013 : 7 850 €, page 103, deux identifiants de ligne ;
- test Highlander 2005 : Land Cruiser 2008 × 40 % = 2 360 €, page 121 ;
- test GLK350 2013 : statut « recoupée », contrôle visuel exigé ;
- test millésime 2024 : champ facture/AVD obligatoire, résultat bloqué sans valeur, aucune extrapolation Argus ;
- test navigateur local : aucun message d'erreur JavaScript observé.

## 10. Recommandation suivante

Pour atteindre une traçabilité de niveau « dossier inspecteur » sur davantage de véhicules, la prochaine évolution doit ajouter un sélecteur facultatif de **version/finition Argus**. Il permettra de choisir une ligne précise parmi toutes les variantes du modèle et de reporter dans le PDF son libellé complet, son montant, sa page et son identifiant, au lieu d'utiliser une plage de versions lorsque la finition est inconnue.
