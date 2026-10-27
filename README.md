# FRUIT NINJA :kiwi_fruit:

## Piloto automático visual

Abra o jogo por um servidor local e clique em **Ativar IA**. O piloto começa a
partida, procura frutas e bombas nos pixels do canvas e corta as frutas usando
a espada do jogo. O botão pausa a automação; quando uma rodada termina, a IA
inicia outra automaticamente e mostra a pontuação acumulada e o recorde. A
pontuação e as vidas de cada rodada seguem as regras originais. Como o jogo não
possui vitória ou fase final, o objetivo é acumular pontos continuamente.
**Fruit Ninja** - the most popular fruit-slicing game in the world! This game is built completely using the **p5js** JavaScript library.


## GETTING STARTED :pencil:

Requires Node.js and npm. In the project folder, run once:

```powershell
npm install
```

Start the local server whenever you want to play:

```powershell
npm start
```

Open http://localhost:8080 in your browser. Click **Ativar IA** to let the visual autoplayer play. Stop the server with `Ctrl+C`.

This project is based on [verma-anushka/Fruit-Ninja](https://github.com/verma-anushka/Fruit-Ninja).

## HOW TO PLAY? :interrobang:
**RULE 1:** Slice fruit :kiwi_fruit: <br/>
**RULE 2:** Don't slice bombs :bomb: <br/>
**...and that is all you need to know to get started with the addictive Fruit Ninja action!!**


## TO-DO :clipboard:
- [x] Add sounds
- [x] Fix bugs
- [ ] Add modes
- [ ] Mobile friendly


## ABOUT p5js :speech_balloon:

### Basic sketch
  - This is the basic setup for a p5.js sketch- **setup()** and **draw()**. 
  - **Note:** p5.js will also require an empty HTML file that links to the p5.js library and your sketch file in the header.

    ```javascript
    function setup() {
      // setup stuff
    }
    function draw() {
      // draw stuff
    }
    ```
    
  - Alternatively, you could use the **preload()** function. 
  - If a preload() block exists it runs first, then setup() will wait until everything in there has completed before it gets run, so you can make use of things loaded in preload in setup and draw.
  
    ```javascript
    let img;
    function preload() {
      img = loadImage('img.jpg');
    }
    ```


## Game Snapshot :camera:
![Fruit Ninja](fruitNinja.png)


## REFERENCES :books:
[p5js Documentation](https://p5js.org/): A complete guide on how to use the **p5js** library.


## CONTRIBUTE :shipit:
Issues, PRs, and all your suggestions and discussions are very welcome!
