# Minuteur avec Barre de Chargement et Checkpoints

Un minuteur web élégant avec barre de progression, système de pauses automatiques (checkpoints) et notifications navigateur.

![Interface du minuteur](https://github.com/user-attachments/assets/b70ff126-de5f-46e5-9ffd-19d78d22792d)

## Fonctionnalités

- ⏱️ **Minuteur personnalisable** : Configurez votre temps de travail avec un format flexible (heures, minutes, secondes)
- 🔔 **Notifications navigateur** : Recevez des alertes même quand l'onglet n'est pas actif
- ☕ **Système de checkpoints** : Pauses automatiques à intervalles réguliers
- 📊 **Barre de progression visuelle** : Suivez votre avancement en temps réel
- 🎨 **Interface élégante** : Design sombre et moderne

## Installation et Utilisation

### Option 1 : Serveur HTTP local (Recommandé)

Pour tester l'application localement avec les notifications fonctionnelles :

#### Avec Python 3

```bash
# Cloner le dépôt
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar

# Démarrer le serveur HTTP
python3 -m http.server 8000

# Ouvrir dans votre navigateur
# Chrome/Edge : http://localhost:8000/timer.html
# Firefox : http://localhost:8000/timer.html
```

#### Avec Node.js (http-server)

```bash
# Installer http-server (si pas déjà installé)
npm install -g http-server

# Cloner et démarrer
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar
http-server -p 8000

# Ouvrir http://localhost:8000/timer.html
```

#### Avec PHP

```bash
# Cloner le dépôt
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar

# Démarrer le serveur PHP
php -S localhost:8000

# Ouvrir http://localhost:8000/timer.html
```

### Option 2 : Fichier local direct

```bash
# Cloner le dépôt
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar

# Ouvrir directement dans le navigateur
# Linux/Mac
open timer.html
# ou
xdg-open timer.html

# Windows
start timer.html
```

**⚠️ Note** : Les notifications peuvent ne pas fonctionner en mode fichier local (`file://`). Utilisez un serveur HTTP local pour une expérience complète.

## Guide d'Utilisation

### Configuration de Base

1. **Définir le temps de travail**
   - Entrez le temps dans le premier champ
   - Format accepté : `1h30m0s`, `45m`, `30s`, `1h`, etc.
   - Exemples :
     - `25m` = 25 minutes (technique Pomodoro)
     - `1h30m` = 1 heure 30 minutes
     - `90s` = 90 secondes

2. **Cliquer sur "Démarrer"**
   - Le minuteur démarre immédiatement
   - La barre verte indique la progression
   - Le temps restant s'affiche en dessous

### Configuration des Checkpoints (Pauses)

Les checkpoints sont des pauses automatiques qui s'activent pendant votre session de travail.

1. **Configurer la durée de la pause**
   - Champ "Durée pause" : combien de temps dure la pause
   - Exemple : `5m` = 5 minutes de pause

2. **Configurer l'intervalle**
   - Champ "Intervalle" : tous les combien de temps de travail
   - Exemple : `25m` = toutes les 25 minutes de travail

3. **Exemple concret (Technique Pomodoro modifiée)**
   ```
   Temps total : 2h
   Durée pause : 5m
   Intervalle : 25m
   
   Résultat : 
   - Travail pendant 25 minutes
   - Pause de 5 minutes (notification)
   - Travail pendant 25 minutes
   - Pause de 5 minutes (notification)
   - etc.
   ```

### Activation des Notifications (Important !)

**Les notifications sont essentielles pour les checkpoints.**

1. **Cliquer sur "Activer les notifications"** (bouton bleu)
2. **Accepter** la demande de permission de Chrome/Firefox
3. Le bouton devient vert : "✓ Notifications activées"
4. Une notification de test apparaît

![Activer les notifications](https://github.com/user-attachments/assets/257232e6-80d9-418f-bfd5-e3a4e3f34ecd)

**Si vous ne voyez pas de notifications** :
- ⚠️ Vérifiez que vous avez cliqué sur "Activer les notifications"
- ⚠️ Vérifiez les paramètres de notification de votre navigateur
- ⚠️ Assurez-vous d'utiliser un serveur HTTP (pas `file://`)

### Comportement des Notifications

Vous recevrez **deux notifications par checkpoint** :

1. **"Pause checkpoint !"** 
   - Quand la pause commence
   - Message : "Prenez une pause de X minute(s)"
   - La barre devient orange

2. **"Pause terminée !"**
   - Quand la pause se termine
   - Message : "Reprise du travail. Bon courage !"
   - La barre redevient verte

![Checkpoint actif](https://github.com/user-attachments/assets/ad9f028c-3563-4bba-bf2f-aea5b3b1d274)

### Caractéristiques des Notifications

- ✅ **Persistantes** : Restent affichées jusqu'à interaction
- ✅ **Fonctionnent en arrière-plan** : Même si l'onglet n'est pas actif
- ✅ **Système d'exploitation** : Notifications natives Windows/Mac/Linux
- ✅ **Son inclus** : Alerte sonore (si non désactivée dans les paramètres)
- ✅ **Vibration mobile** : Sur les appareils compatibles

## Exemples d'Utilisation

### Exemple 1 : Pomodoro Classique
```
Temps total : 25m
Durée pause : (vide)
Intervalle : (vide)
```
Timer simple de 25 minutes sans checkpoints.

### Exemple 2 : Pomodoro avec Pauses
```
Temps total : 2h
Durée pause : 5m
Intervalle : 25m
```
Session de 2 heures avec pauses de 5 minutes toutes les 25 minutes.

### Exemple 3 : Session Longue avec Micro-pauses
```
Temps total : 3h
Durée pause : 2m
Intervalle : 50m
```
Session de 3 heures avec pauses courtes de 2 minutes toutes les 50 minutes.

### Exemple 4 : Test Rapide
```
Temps total : 30s
Durée pause : 3s
Intervalle : 10s
```
Pour tester rapidement les fonctionnalités (10s de travail, 3s de pause).

## Compatibilité Navigateur

| Navigateur | Version | Notifications | Checkpoints |
|------------|---------|---------------|-------------|
| Chrome     | ≥ 22    | ✅            | ✅          |
| Firefox    | ≥ 22    | ✅            | ✅          |
| Edge       | ≥ 14    | ✅            | ✅          |
| Safari     | ≥ 7     | ✅            | ✅          |
| Opera      | ≥ 25    | ✅            | ✅          |

## Résolution de Problèmes

### Les notifications n'apparaissent pas

**Vérifications :**

1. **Permission accordée ?**
   ```
   - Cliquez sur "Activer les notifications"
   - Vérifiez que le bouton est vert
   - Rechargez la page si nécessaire
   ```

2. **Paramètres du navigateur (Chrome)**
   ```
   1. Ouvrir chrome://settings/content/notifications
   2. Vérifier que les notifications sont autorisées
   3. Vérifier que localhost:8000 est dans la liste des autorisations
   ```

3. **Paramètres du navigateur (Firefox)**
   ```
   1. Ouvrir about:preferences#privacy
   2. Section "Permissions" > "Notifications" > "Paramètres"
   3. Vérifier localhost:8000
   ```

4. **Mode fichier local**
   ```bash
   # Les notifications ne fonctionnent pas avec file://
   # Utilisez un serveur HTTP :
   python3 -m http.server 8000
   ```

5. **Console développeur**
   ```
   Appuyez sur F12 pour ouvrir la console
   Vérifiez les messages d'erreur
   Recherchez "Permission accordée: false"
   ```

### Le checkpoint ne se déclenche pas

- ✅ Vérifiez que les deux champs (durée et intervalle) sont remplis
- ✅ Utilisez le format correct : `5m`, `30s`, `1h`, etc.
- ✅ Le checkpoint se base sur le temps de **travail** (pas le temps total)

### La barre ne progresse pas

- Rechargez la page (F5)
- Vérifiez le format du temps
- Ouvrez la console (F12) pour voir les erreurs

## Développement

### Structure du Projet

```
loading_bar/
├── timer.html          # Application complète (HTML + CSS + JS)
└── README.md          # Ce fichier
```

### Technologies Utilisées

- HTML5
- CSS3 (Flexbox, Gradients, Transitions)
- JavaScript Vanilla (ES6+)
- Notification API
- Vibration API (mobile)

### Contribution

Les contributions sont les bienvenues ! 

```bash
# Fork le projet
git clone https://github.com/votre-username/loading_bar.git
cd loading_bar

# Créer une branche
git checkout -b feature/ma-fonctionnalite

# Faire vos modifications
# Tester localement
python3 -m http.server 8000

# Commit et push
git add .
git commit -m "Ajout de ma fonctionnalité"
git push origin feature/ma-fonctionnalite

# Créer une Pull Request sur GitHub
```

## Licence

Ce projet est libre d'utilisation.

## Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Vérifier la section "Résolution de Problèmes" ci-dessus
- Consulter la console développeur (F12) pour les messages de debug

---

**Bon travail et bonnes pauses ! ☕⏱️**
