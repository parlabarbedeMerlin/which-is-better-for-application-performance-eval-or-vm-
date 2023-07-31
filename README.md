# Comparaison de performance pour l'exécution de code JS

<h2 id="Abstract">Abstract</h2>
L'objectif de ce document est de comparer les différentes solutions pour exécuter du code JS côté serveur avec NodeJS. Nous allons donc voir les avantages et les inconvénients de chacune de ces solutions.

<h2 id="Introduction">Introduction</h2>
Imaginons que nous souhaitions créer un site de clash of code pour encourager l'apprentissage du JS. Une des plus grosses problématiques est l'exécution du code de notre utilisateur pour vérifier si son code est correct. Nous allons donc comparer les différentes solutions pour exécuter du code JS.

Il existe 3 façons d'exécuter du code JS côté serveur avec NodeJS :
- [child_process](https://nodejs.org/api/child_process.html)
- [vm](https://nodejs.org/api/vm.html)
- [eval](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/eval)
- [worker_threads](https://nodejs.org/api/worker_threads.html)

Nous allons donc voir les avantages et les inconvénients de chacune de ces solutions, à l'exception des worker threads car le principe est le même que celui de child_process, à la différence qu'ils tournent sur un thread réel différent. Ils sont donc forcément plus rapides, mais ils rendent le code encore plus opaque. Donc, en raison de leur similarité avec child_process, nous ne les étudierons pas (partez du principe que, dans une assez large majorité des cas, worker threads seront toujours plus rapides).

## Sommaire
1. [Abstract](#Abstract)
2. [Introduction](#Introduction)
3. [Les calculs de performance](#Les-calculs-de-performance)
    1. [Les Tests](#Les-Tests)
        1. [Comment sont effectués les tests](#Comment-sont-effectues-les-tests)
        2. [Les résultats](#Les-resultats)
    2. [Les explications possibles](#Les-explications-possibles)
4. [En termes de sécurité](#Securite)
    1. [Child process](#Child-process-secu)
    2. [Eval](#Eval-secu)
    3. [VM](#VM-secu)
5. [Facilité d'utilisation](#Facilite)
    1. [Child process](#Child-process-facilite)
    2. [Eval](#Eval-facilite)
    3. [VM](#VM-facilite)
6. [Conclusion](#Conclusion)
7. [Sources](#Sources)

<h2 id="Les-calculs-de-performance">Les calculs de performance</h2>
<h3 id="Les-Tests">Les Tests</h3>

<h4 id="Comment-sont-effectues-les-tests">Comment sont effectués les tests</h4>
Pour effectuer ces tests, le même calcul a été effectué 1000 fois avec chaque méthode. Ce calcul est effectué dans une API Next.js 13.4.12 avec Node.js 18.17.0. Ensuite, on effectue 1000 requêtes à l'API pour chaque méthode à l'aide d'un script Python qui mesure le temps de chaque requête que l'on enregistre dans un CSV :

```python
import requests

file = open("./analyse.csv","a")

url1 = "http://localhost:3000/api/calc"
url2 = "http://localhost:3000/api/calc-vm"
url3 = "http://localhost:3000/api/calc-cp"

for i in range(1, 10000):
file.write(str(i) + ",")

    #calcul time for calc with each url
    #url1
    r = requests.get(url1)
    file.write(str(r.elapsed.total_seconds()) + ",")

    #url2
    r = requests.get(url2)
    file.write(str(r.elapsed.total_seconds()) + ",")

    #url3
    r = requests.get(url3)
    file.write(str(r.elapsed.total_seconds()) + "\n")

    print(i)
```

Ensuite, on fait la moyenne de tous nos calculs pour chaque méthode et on les affiche dans un graphique avec Python et Matplotlib :

```python
import csv

file = open("./analyse.csv","r")
reader = csv.reader(file)

linecount = 0

col1 = 0
col2 = 0
col3 = 0

#skip first line
next(reader)

for row in reader:
    col1 += float(row[1])
    col2 += float(row[2])
    col3 += float(row[3])
    linecount += 1

col1 = col1 / linecount
col2 = col2 / linecount
col3 = col3 / linecount

import matplotlib.pyplot as plt
fig,ax = plt.subplots()
ax.barh(0, col1, label='calc', color='#52994e')
ax.barh(1 , col3, label='calc-vm', color='#e3ba4b')
ax.barh(2, col2, label='calc-cp' ,color='#d14545')
ax.invert_yaxis()
ax.set_xlabel('Time (s)')
ax.set_ylabel('URL')
ax.set_title('Time of each URL')
ax.legend()
plt.show()
```

<h4 id="Les-resultats">Les résultats</h4>
Le dernier programme nous renvoie les résultats suivants sous forme la forme d'un graphique :
<img src="https://github.com/parlabarbedeMerlin/which-is-better-for-application-performance-eval-or-vm-/blob/main/rmimg/img.png?raw=true">
Comme nous pouvons l'observer dans le graphique ci-dessus, pour effectuer un même calcul, le plus rapide reste le child process, ensuite vient eval et enfin le vm. Nous allons donc essayer d'apporter une explication à ces résultats.

<h3 id="Les-explications-possibles">Les explications possibles</h3>
Tout d'abord, il est assez logique de voir que le child process est le plus rapide pour effectuer un même calcul :
> La librairie child_process permet de créer des processus enfants, de communiquer avec eux et de les contrôler. Le module fournit des fonctions pour créer des processus (spawn), pour communiquer avec eux via des flux (exec, execFile, spawn), et pour les contrôler (kill, pid). Le module fournit également des fonctions pour gérer les processus en tant que groupe (setuid, setgid, setgroups, et initgroups).

Les subprocess sont, comme leur nom l'indique, exécutés comme des sous-processus et utilisent donc les ressources de la machine. C'est donc pour cela qu'ils sont les plus rapides.

La fonction eval, quant à elle, est une fonction native de JS qui permet d'évaluer une chaîne de caractères comme du code JS. Elle est donc plus rapide que vm car elle est native et ne nécessite pas de créer un contexte d'exécution puis de faire une vm node (sur une vm node) pour pouvoir exécuter le code. Intéressons-nous au fonctionnement de eval :
1. eval commence par créer un arbre de syntaxe abstraite (AST) à partir de la chaîne de caractères (c'est une représentation abstraite de la structure d'un programme informatique sous la forme d'un arbre).
2. eval va ensuite compiler l'AST en bytecode (le bytecode est un binaire intermédiaire entre le code source et les instructions machine).
3. eval va ensuite exécuter le bytecode comme s'il était écrit dans le contexte d'appel (l'endroit où la fonction est appelée).

Maintenant, intéressons-nous au fonctionnement de Node.js vm :
Le module Node.js vm est par défaut inclus dans Node.js et permet d'exécuter du code Node.js dans un contexte particulier. Pour comprendre, intéressons-nous à Node.js vm :
1. Lorsque l'on exécute notre fonction avec Node.js, notre programme doit tout d'abord définir un contexte dans lequel mon code sera exécuté.
2. Ensuite, il crée une machine virtuelle (vm) qui va exécuter le code dans le contexte défini précédemment.

Donc, notre programme Node.js (qui s'exécute dans une vm) va créer une vm pour exécuter du code Node.js dans un contexte particulier. C'est donc pour cela que le vm est plus lent que eval. Beaucoup de langages très performants s'exécutent dans des vm pour apporter de la stabilité. Cependant, le fait de créer une vm dans une vm est très coûteux en ressources et donc en temps d'exécution.

<h2 id="Securite">Sécurité</h2>
<h3 id="Child-process-secu">Child process</h3>
Les child process peuvent comporter des failles de sécurité car ils sont exécutés comme des sous-processus et donc peuvent avoir accès à toutes les ressources de la machine. Il est donc très important de bien sécuriser les child process de façon à ce qu'ils n'aient accès qu'aux ressources dont ils ont besoin. Ce sous-processus peut aussi surcharger la machine et donc la rendre inutilisable.

<h3 id="Eval-secu">Eval</h3>
Eval, quant à lui, est très dangereux car il permet d'exécuter du code JS arbitraire. Il est donc très important de ne jamais utiliser eval avec des données provenant de l'utilisateur ou en tout cas ce code doit être très vérifié avant d'être exécuté pour s'assurer qu'il ne risque pas de porter atteinte à la sécurité de la machine.

<h3 id="VM-secu">VM</h3>
Les VM ont l'avantage d'être très sécurisés car ils sont exécutés dans un contexte particulier et donc ne peuvent pas accéder aux ressources de la machine. Cependant, il est possible de créer des failles de sécurité en utilisant des modules Node.js qui permettent d'accéder aux ressources de la machine. Il est donc très important de bien sécuriser les VM de façon à ce qu'ils n'aient accès qu'aux ressources dont ils ont besoin.

<h2 id="Facilite">Facilité d'utilisation</h2>
<h3 id="Child-process-facilite">Child process</h3>
Les child process sont assez compliqués à utiliser car il faut créer un processus enfant, lui passer les arguments et récupérer le résultat. Il faut aussi gérer les erreurs et les exceptions. Il est donc assez compliqué de mettre en place un child process.

<h3 id="Eval-facilite">Eval</h3>
Eval est très facile à mettre en place car il suffit de passer une chaîne de caractères à eval et il va l'exécuter. Cependant, il est très dangereux et il faut donc faire très attention à ce que l'on passe à eval.

<h3 id="VM-facilite">VM</h3>
Le module Node.js VM peut être assez compliqué à mettre en place selon ce que l'on souhaite faire. En effet, il faut créer un contexte d'exécution, créer une vm et exécuter le code dans la vm. Il faut aussi gérer les erreurs et les exceptions. Il est donc assez compliqué de mettre en place une vm.

<h2 id="Conclusion">Conclusion</h2>
Nous avons donc vu que le child process est le plus rapide pour exécuter du code JS, cependant, il est très dangereux car il peut accéder à toutes les ressources de la machine. Eval, quant à lui, est très rapide mais très dangereux car il permet d'exécuter du code arbitraire. La vm est le plus lent mais est très sécurisée car elle ne peut pas accéder aux ressources de la machine. Il est donc très important de bien sécuriser les child process et les vm de façon à ce qu'ils n'aient accès qu'aux ressources dont ils ont besoin.

Voici un tableau récapitulatif des avantages et des inconvénients de chaque solution:

|                   |                    **Avantages**                     |                                  **Inconvénients**                                  |
|:-----------------:|:----------------------------------------------------:|:-----------------------------------------------------------------------------------:|
| **Child process** |                     Très rapide                      |                     Pas sécurisé et difficile à mettre en place                     |
|     **Eval**      |          Rapide et facile à mettre en place          | N'est pas du tout sécurisé (ne surtout pas évaluer un code donné par l'utilisateur) |
|      **VM**       | Très sécurisé si le contexte est correctement défini |                         Lent et difficile à mettre en place                         |

Pour conclure, dans notre cas, la solution la plus adaptée pour réaliser un clash of code sera la vm car elle est très sécurisée et l'utilisateur ne devrait pas faire d'action trop complexe, et s'il en fait, c'est qu'il cherche à nuire, donc il n'est pas important que son exécution soit lente. Cependant, l'utilisation de child process est aussi envisageable car il est très rapide et cela permettrait d'exécuter un code dans n'importe quel langage, et pas seulement du JS. Il faudrait cependant bien sécuriser les child process de façon à ce qu'ils n'aient accès qu'aux ressources dont ils ont besoin.

<h2 id="Sources">Sources</h2>
- Child process: [https://nodejs.org/api/child_process.html](https://nodejs.org/api/child_process.html)
- Eval: [https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/eval](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/eval)
- VM: [https://nodejs.org/api/vm.html](https://nodejs.org/api/vm.html)
