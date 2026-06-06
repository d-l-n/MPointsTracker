type RulesSection = {
  title: string;
  text: string;
};

type RuleEntry = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sections: RulesSection[];
};

const RULES_DATA: RuleEntry[] = [
  {
    id:"uno", name:"UNO", emoji:"🃏", color:"#E63946",
    sections:[
      {title:"Objetivo",text:"Ser el primero en llegar a 500 puntos acumulados en varias rondas. Cada ronda termina cuando un jugador se queda sin cartas."},
      {title:"Preparación",text:"Se reparten 7 cartas a cada jugador. El resto forma el mazo de robo boca abajo. Se voltea la carta de arriba para iniciar el descarte. El jugador a la izquierda del repartidor empieza."},
      {title:"Cómo jugar",text:"En tu turno hacé coincidir una carta de tu mano con la carta del descarte, ya sea por número, color o símbolo.\nSi no podés jugar, robá una carta del mazo. Si la carta que robaste es jugable, podés usarla ese mismo turno.\nTambién podés elegir NO jugar una carta jugable. En ese caso debés robar una carta, y si esa carta es jugable podés bajarla, pero no podés jugar ninguna otra carta de tu mano después del robo.\nCuando te quede una carta, ¡gritá UNO! Si te atrapan sin haberlo dicho antes de que el siguiente jugador empiece su turno, robás 2 cartas."},
      {title:"Cartas de acción",text:"Roba Dos (+2): el siguiente jugador roba 2 cartas y pierde su turno. Solo se puede jugar sobre una carta del mismo color o sobre otra Roba Dos.\nReversa: invierte la dirección del juego. Solo se puede jugar sobre el mismo color u otra Reversa. Con 2 jugadores, el repartidor juega primero.\nSalta: el siguiente jugador pierde su turno. Solo se puede jugar sobre el mismo color u otra Salta.\nComodín: elegís el color que continúa, incluso el mismo color actual. Se puede jugar en cualquier momento, aunque tengas otra carta jugable.\nComodín Roba 4: elegís el color y el siguiente jugador roba 4 cartas y pierde su turno. ¡Trampa! Solo podés jugarlo si NO tenés ninguna carta del color actual en la mano (sí podés tenerla si coincide en número o acción). Si se sospecha juego ilegal, se puede desafiar al jugador a mostrar su mano."},
      {title:"Puntuación",text:"El ganador de la ronda suma los puntos de las cartas que quedaron en manos de los demás:\n• Números (0–9): valor nominal\n• Roba Dos / Reversa / Salta: 20 pts\n• Comodín / Comodín Roba 4: 50 pts\nMeta: 500 pts.\n\nPuntuación alternativa: también podés llevar el acumulado de todos los jugadores. Cuando alguien llega a 500, gana quien tenga menos puntos."},
      {title:"Reglas de la casa",text:"UNO Progresivo: cuando alguien juega Roba Dos, el siguiente puede apilar otra Roba Dos y pasarle el castigo al que sigue (4 cartas). Lo mismo con Comodín Roba 4 (8 cartas acumuladas). El último en apilar elige el color.\nSiete-0: al jugar un 0, todos pasan su mano al siguiente jugador en la dirección del juego. Al jugar un 7, el jugador intercambia su mano con otro de su elección.\nDescarte inmediato (Jump-In): si tenés exactamente la misma carta (color y número) que la del descarte, podés jugarla aunque no sea tu turno. El juego continúa desde vos. Si tenés 2 iguales, podés jugar ambas de a una, dando chance a que otro se meta entre medio."},
    ]},
  {
    id:"uno_no_mercy", name:"UNO No Mercy", emoji:"💀", color:"var(--nomercy)",
    sections:[
      {title:"Objetivo",text:"Sé el primero en deshacerte de todas tus cartas, o eliminá a todos los demás jugadores para ser el único que quede. El juego combina la victoria por vaciado de mano con la eliminación por la regla Piedad."},
      {title:"Preparación",text:"Se usa un mazo de 168 cartas. Se reparten 7 cartas a cada jugador. El resto forma la pila para tomar boca abajo. Se voltea la primera carta (si es de acción, se ignora y se voltea la siguiente). El jugador a la izquierda del repartidor empieza."},
      {title:"Cómo jugar",text:"En tu turno jugá UNA CARTA a la vez en la pila para tirar.\n• Si TENÉS una carta que coincida (color, número o símbolo): jugala.\n• Si NO TENÉS ninguna que coincida: debés robar cartas de la pila hasta sacar una que puedas jugar. Luego jugá esa carta.\nSi la pila para tomar se vacía, barajá la pila para tirar y continuá."},
      {title:"Reglas especiales",text:"Apilar: si alguien juega una carta para tomar (+2, +4, +6, +10), podés 'apilar' jugando una de tus cartas de igual o mayor valor. El castigo se acumula para el siguiente jugador. Esto continúa hasta que alguien no pueda apilar y deba tomar todas las cartas acumuladas.\n\nPiedad (Mercy Rule): si un jugador tiene 25 cartas o más, queda eliminado del juego. Su mano se aparta hasta que se acabe el mazo y se baraje de nuevo.\n\nIntercambio con 7: al jugar un 7 de cualquier color, DEBÉS intercambiar tu mano con otro jugador de tu elección.\n\nPaso de mano con 0: al jugar un 0 de cualquier color, TODOS los jugadores deben pasarle sus cartas al siguiente jugador en la dirección actual del juego."},
      {title:"Cartas de acción",text:"Toma 2 (+2): el siguiente jugador toma 2 cartas y pierde su turno.\nToma 4 (+4): el siguiente jugador toma 4 cartas y pierde su turno.\nSalta: el siguiente jugador pierde su turno.\nReversa: cambia la dirección. Con 2 jugadores, salta al otro y te da otro turno.\nTira un color: descartás todas las cartas de tu mano que coincidan con el color de esta carta.\nSalta a todos: todos pierden su turno y vos jugás de nuevo.\nComodín Reversa Toma 4: invierte la dirección y el siguiente jugador (en la nueva dirección) toma 4 y pierde su turno. Con 2 jugadores, TÚ tomás 4.\nComodín Toma 6: el siguiente jugador toma 6 cartas y pierde su turno.\nComodín Toma 10: el siguiente jugador toma 10 cartas y pierde su turno.\nComodín Ruleta de Color: el siguiente jugador elige un color y roba cartas de una en una hasta sacar una de ese color (los comodines no cuentan). Toma todas las cartas dadas vuelta y pierde su turno."},
      {title:"Puntuación",text:"Cuando un jugador gana una mano, suma los puntos de las cartas de sus oponentes (no de los eliminados):\n• Números (0–9): valor nominal\n• Cartas de color y acción (Salta, Reversa, +2, +4, Tira un color, Salta a todos): 20 pts\n• Comodines de acción (Reversa+4, +6, +10, Ruleta de color): 50 pts\n• Bonificación Piedad: +250 pts por cada jugador eliminado durante la mano\nMeta: 1000 pts."},
    ]},
  {
    id:"uno_flip", name:"UNO Flip", emoji:"🔄", color:"#7B2FBE",
    sections:[
      {title:"Objetivo",text:"Ser el primero en llegar a 500 puntos. Cada ronda termina cuando un jugador se queda sin cartas."},
      {title:"El concepto Flip",text:"El mazo tiene dos lados: Lado Claro (borde blanco) y Lado Oscuro (borde negro). Se empieza con el Lado Claro. Cuando alguien juega una carta FLIP, todo el juego se da vuelta: la pila de descarte, el mazo y las manos de todos. El nuevo lado permanece en juego hasta que alguien juegue otra carta Flip.\n\nImportante: al agregar cartas a tu mano, siempre asegurate de que estén orientadas correctamente (el lado activo mirando hacia vos)."},
      {title:"Lado Claro — Cartas de acción",text:"Draw One (+1): el siguiente jugador roba 1 carta y pierde su turno.\nReversa: invierte la dirección del juego.\nSalta: el siguiente jugador pierde su turno.\nFlip: da vuelta todo al Lado Oscuro.\nWild (Comodín): elegís el color que continúa.\nWild Draw Two: elegís el color y el siguiente jugador roba 2 cartas y pierde su turno. Solo se puede jugar si no tenés carta del color actual (podés tenerla si coincide en número o acción). Se puede desafiar."},
      {title:"Lado Oscuro — Cartas de acción",text:"Draw Five (+5): el siguiente jugador roba 5 cartas y pierde su turno.\nReversa: invierte la dirección del juego.\nSkip Everyone: todos los jugadores pierden su turno; el que jugó la carta vuelve a jugar.\nFlip: da vuelta todo al Lado Claro.\nWild (Comodín): elegís el color que continúa.\nWild Draw Color: elegís un color y el siguiente jugador roba cartas de una en una hasta sacar una de ese color (los comodines no cuentan), luego toma todas las cartas dadas vuelta y pierde su turno. Solo se puede jugar si no tenés carta del color actual. Se puede desafiar."},
      {title:"Puntuación",text:"Se puntúan las cartas según el lado que estaba activo al terminar la ronda:\n\nLado Claro:\n• Números (1–9): valor nominal\n• Draw One: 10 pts\n• Reversa / Salta / Flip: 20 pts\n• Wild: 40 pts\n• Wild Draw Two: 50 pts\n\nLado Oscuro:\n• Números (1–9): valor nominal\n• Draw Five / Reversa / Flip: 20 pts\n• Skip Everyone: 30 pts\n• Wild: 40 pts\n• Wild Draw Color: 60 pts\n\nMeta: 500 pts.\n\nPuntuación alternativa: también podés llevar el acumulado. Cuando alguien llega a 500, gana quien tenga menos puntos."},
    ]},
  {
    id:"uno_dos", name:"DOS", emoji:"✌️", color:"#2980B9",
    sections:[
      {title:"Objetivo",text:"Ser el primero en llegar a 200 puntos ganando rondas. Cada ronda termina cuando un jugador se queda sin cartas."},
      {title:"Preparación",text:"Se reparten 7 cartas a cada jugador. El repartidor coloca 2 cartas boca arriba en el centro para formar la Hilera Central. El mazo queda al lado dejando espacio para la pila de descarte. El jugador a la izquierda del repartidor empieza."},
      {title:"Cómo jugar",text:"En tu turno debés hacer una de estas dos cosas:\n1. EMPAREJAR: jugá una o más cartas de tu mano que coincidan con una o las dos cartas de la Hilera Central.\n2. ROBAR: si no podés o no querés emparejar, robá una carta. Si después de robar podés emparejar, podés hacerlo. Si aun así no podés, añadí una carta de tu mano boca arriba a la Hilera Central.\n\nImportante: si hay más de 2 cartas en la Hilera Central, podés intentar emparejar con cualquiera de ellas. Siempre debe haber al menos 2 cartas en la Hilera Central."},
      {title:"Tipos de pareja",text:"Pareja sencilla de número: jugá una sola carta que coincida en número con una carta de la Hilera Central (sin importar el color).\n\nPareja doble de número: jugá DOS cartas (no más) que sumen el valor de una carta de la Hilera Central (ej: 5+2 sobre un 7). Sin importar el color.\n\nSolo podés hacer una pareja por carta de la Hilera Central por turno."},
      {title:"Bonificaciones de color",text:"Pareja sencilla de color: si la carta que jugás coincide en número Y color con una de la Hilera Central, al final de tu turno podés añadir una carta de tu mano boca arriba a la Hilera Central.\n\nPareja doble de color: si las DOS cartas que jugás suman el valor Y son del mismo color que una carta de la Hilera Central, al final de tu turno (1) añadís una carta a la Hilera Central y (2) todos los demás jugadores roban una carta.\n\nOjo: si solo UNA de las dos cartas coincide en color, no se gana la bonificación doble."},
      {title:"Final del turno",text:"Al terminar tu turno, seguí estos pasos EN ORDEN:\n1. Tomá todas las cartas que jugaste (incluidas las de la Hilera Central) y ponlas en la pila de descarte.\n2. Si quedan menos de 2 cartas en la Hilera Central, completá con cartas del mazo hasta tener 2.\n3. Si ganaste bonificaciones de color, añadí una carta de tu mano a la Hilera Central por cada bonificación."},
      {title:"Cartas especiales",text:"Wild DOS™: vale como un 2 de cualquier color. Vos decidís el color al jugarlo. Si está en la Hilera Central, quien lo empareja decide su color.\nEjemplo: con un 5 rojo y un Wild DOS™ podés hacer una pareja doble de color sobre un 7 rojo. Si el 5 no es rojo, igual podés hacer una pareja doble de número.\n\nWild # (Comodín #): vale cualquier número del 1 al 10 del color de la carta. Vos decidís el número al jugarlo.\nEjemplo: con un 3 azul y un Wild # amarillo, podés designar el Wild # como 4 y emparejar ambos sobre un 7 (pareja doble de número). Si ambos fueran rojos, sería pareja doble de color."},
      {title:"Regla DOS",text:"Cuando te queden exactamente 2 cartas en la mano, debés gritar '¡DOS!'. Si otro jugador lo dice antes que vos, debés robar 2 cartas de penalización. Si esto ocurre durante tu turno, las cartas de penalización se suman al final del turno."},
      {title:"Puntuación",text:"El ganador de la ronda suma los puntos de las cartas que quedaron en las manos de los demás:\n• Números (1, 3–10): valor nominal\n• Wild DOS™: 20 pts\n• Wild # (Comodín #): 40 pts\nMeta: 200 pts.\n\nPuntuación alternativa: también podés llevar el acumulado. Cuando alguien llega a 200, gana quien tenga menos puntos."},
    ]},
  {
    id:"truco", name:"Truco", emoji:"🧉", color:"#8B5E3C",
    sections:[
      {title:"Objetivo",text:"Ser el primero en llegar al límite acordado de puntos (15 o 30), jugando mano a mano o en equipos."},
      {title:"Preparación",text:"Se juega con mazo español de 40 cartas (se retiran los 8s, 9s y comodines). Se reparten 3 cartas por jugador."},
      {title:"Jerarquía de cartas",text:"1° Ancho de espadas · 2° Uno de bastos · 3° Siete de espadas · 4° Siete de oros · 5° Todos los 3s · 6° Todos los 2s · 7° Todos los 1s restantes · 8° Todos los 12s · 9° Todos los 11s · 10° Todos los 10s · 11° Todos los 7s restantes · 12° Todos los 6s · 13° Todos los 5s · 14° Todos los 4s"},
      {title:"El Truco",text:"Cualquier jugador puede cantar Truco. Opciones: Quiero (2 pts), No Quiero (1 pt), Re-Truco (3 pts), Vale Cuatro (4 pts)."},
      {title:"El Envido",text:"Se canta antes de la primera baza. Suma los valores de dos cartas del mismo palo (figuras=0). Envido=2 pts, Real Envido=3 pts, Falta Envido=los puntos que falten para ganar."},
      {title:"La Flor",text:"Si tenés 3 cartas del mismo palo, debés cantar Flor. Flor=3 pts, Contraflor=4 pts, Contraflor al Resto=los puntos que falten. La Flor tiene prioridad sobre el Envido."},
      {title:"Puntuación",text:"Los puntos se acumulan mano a mano. Gana quien primero llega a 15 o 30 puntos. Los puntos del Envido se cuentan aunque la mano se pierda."},
    ]},
  {
    id:"chancho", name:"Chancho", emoji:"🐷", color:"#E91E8C",
    sections:[
      {title:"Objetivo",text:"Ser el último jugador en pie. Los demás van siendo eliminados al completar la palabra C-H-A-N-C-H-O (7 letras = eliminado)."},
      {title:"Preparación",text:"Se usan 4 cartas de cada valor para cada jugador (ej: con 4 jugadores, se usan 4 grupos de 4 cartas iguales = 16 cartas). Se coloca una ficha/cuchara menos que la cantidad de jugadores en el centro de la mesa. Se reparten 4 cartas a cada jugador."},
      {title:"Cómo jugar",text:"Todos los jugadores toman simultáneamente una carta del mazo que les pasa el jugador a su izquierda, y descartan una hacia la derecha. El objetivo es juntar 4 cartas iguales. Cuando alguien completa las 4 cartas, agarra una ficha del centro. Al ver que alguien agarró una ficha, TODOS los demás deben agarrar una ficha también, lo más rápido posible. El jugador que no llega a agarrar una ficha recibe una letra."},
      {title:"Las letras",text:"Las letras se acumulan formando la palabra CHANCHO:\nC → H → A → N → C → H → O\nAl completar CHANCHO (7 letras), el jugador queda eliminado."},
      {title:"Variante sin fichas",text:"Si no tienen fichas/cucharas, cuando alguien completa 4 iguales se toca la nariz discretamente. El resto debe imitarlo. El último en tocarse recibe la letra."},
      {title:"Fin del juego",text:"El juego continúa eliminando jugadores hasta que quede uno solo, que es el ganador. Con cada eliminación se retira una ficha del centro."},
    ]},
  {
    id:"esquinados", name:"Esquinados", emoji:"🟩", color:"#2E7D32",
    sections:[
      {title:"Objetivo",text:"Ser el primero en quedarse sin cartas. Juego de atención y velocidad de Maldón para 2 a 5 jugadores."},
      {title:"Las cartas",text:"Cada carta tiene una figura central en cada lado y figuras cortadas en cada esquina. Hay que encontrar la figura cortada de tu carta que coincida en forma y color con la figura central de la carta del pozo."},
      {title:"Cómo se juega",text:"Se reparten todas las cartas entre los jugadores. Se pone una carta en el centro y comienza el juego. No hay turnos — todos juegan al mismo tiempo. Cuando encontrás en tus esquinas una figura que coincide en forma y color con la figura central del pozo, apoyás tu carta encima lo más rápido posible. Eso cambia la figura central y todos deben buscar de nuevo. Las cartas no tienen orden: siempre buscás entre todas las que tenés en la mano."},
      {title:"Fin de la ronda",text:"Gana la ronda el primero en quedarse sin cartas."},
      {title:"Duración",text:"Cada partida dura entre 5 y 10 minutos. La app registra quién gana cada ronda."},
    ],
  },
  {
    id:"chin", name:"Chin", emoji:"🎯", color:"#8B1A1A",
    sections:[
      {title:"Objetivo",text:"Ser el primero en quedarse sin cartas en la mano. Se juega 1 contra 1."},
      {title:"Preparación",text:"Se usa mazo español o francés. Se reparten cartas a cada jugador. En el centro de la mesa se colocan 2 cartas boca arriba que forman las pilas de descarte."},
      {title:"Cómo jugar",text:"En tu turno jugás una carta que coincida con alguna de las 2 cartas centrales (por número o palo, según la variante). Si no podés jugar, robás del mazo. El turno pasa al rival. Las cartas jugadas se apilan sobre la central correspondiente y la nueva carta visible es la referencia para el siguiente turno."},
      {title:"Fin de la ronda",text:"Gana la ronda el primero en quedarse sin cartas en la mano. El otro jugador recibe una anotación."},
      {title:"Seguimiento",text:"La app registra quién gana cada ronda. Podés definir cuántas rondas jugar o llevar el conteo libremente."},
    ]},
  {
    id:"chinchon", name:"Chinchón", emoji:"🀄", color:"#E67E22",
    sections:[
      {title:"Objetivo",text:"Ser el último jugador en no superar los 100 puntos. También se puede ganar haciendo Chinchón (escalera de 7 cartas del mismo palo), lo que da la victoria inmediata."},
      {title:"Preparación",text:"Se usa mazo español de 40 cartas. Se reparten 7 cartas a cada jugador. Se deja una carta boca arriba junto al mazo boca abajo para iniciar el descarte."},
      {title:"Cómo jugar",text:"En tu turno tomás una carta del mazo o del descarte. Luego descartás una carta. El objetivo es combinar tus cartas en escaleras (3+ cartas del mismo palo consecutivas) o tríos/cuartetos (3-4 cartas del mismo valor)."},
      {title:"Cómo cortar",text:"Podés cortar cuando tus cartas sin combinar suman 5 puntos o menos (según la variante). Colocás la carta de descarte boca abajo en señal de corte. Los demás muestran sus combinaciones y pueden 'descargar' cartas sobrantes en las jugadas ajenas."},
      {title:"Chinchón",text:"Si formás una escalera con tus 7 cartas (sin comodín), ganás la partida inmediatamente. Si usás comodín para completarla, no ganás pero se te restan 25 puntos."},
      {title:"Puntuación",text:"Valor de cartas sin combinar:\n• As: 1 pt\n• Números 2–7: valor nominal\n• Sota (10), Caballo (11), Rey (12): valor nominal\n• Comodín sin usar: 25 pts\nQuien cierra con todas combinadas: -10 pts.\nQuien supera 100 pts por primera vez: se 'engancha' tomando el puntaje más alto de los demás.\nQuien supera 100 pts por segunda vez: eliminado.\nEntre dos jugadores no hay reenganche."},
    ]},
  {
    id:"rummy", name:"Rummy", emoji:"🃏", color:"#2980B9",
    sections:[
      {title:"Objetivo",text:"Ser el primero en llegar a 500 puntos acumulados ganando rondas. Cada ronda termina cuando un jugador se queda sin cartas en la mano."},
      {title:"Preparación",text:"Se usa mazo francés de 52 cartas (con o sin comodines). Con 2-4 jugadores se reparten 10 cartas; con 5-6 jugadores, 7 cartas. El resto forma el mazo de robo con una carta inicial boca arriba."},
      {title:"Cómo jugar",text:"En tu turno tomás una carta del mazo o del descarte. Podés bajar combinaciones a la mesa:\n• Escalera: 3+ cartas consecutivas del mismo palo.\n• Grupo: 3-4 cartas del mismo valor.\nPodés agregar cartas a combinaciones ya bajadas (propias o ajenas). Al final del turno descartás una carta."},
      {title:"Rummy",text:"Si podés bajar TODAS tus cartas de una sola vez sin haber bajado nada antes, hacés 'Rummy'. El puntaje se duplica para vos."},
      {title:"Puntuación",text:"El ganador de la ronda suma los puntos de las cartas que quedaron en manos de los demás:\n• As: 1 pt\n• Números 2–10: valor nominal\n• Figura (J, Q, K): 10 pts\n• Comodín: 25 pts\nSi hacés Rummy: puntaje doble.\nMeta: 500 pts."},
    ]},
  {
    id:"poker", name:"Póker", emoji:"♦️", color:"#E63946",
    sections:[
      {title:"Objetivo",text:"Ganar las fichas/apuestas de los otros jugadores formando la mejor mano de 5 cartas o haciendo que los demás se retiren."},
      {title:"Variante Texas Hold'em",text:"Cada jugador recibe 2 cartas privadas (hole cards). Se revelan 5 cartas comunitarias en tres rondas: el Flop (3 cartas), el Turn (1 carta) y el River (1 carta). Cada jugador forma su mejor mano con 5 de las 7 cartas disponibles."},
      {title:"Rondas de apuesta",text:"Hay una ronda de apuesta antes del Flop (preflop) y una después de cada carta comunitaria. Las acciones posibles son: Check (pasar sin apostar), Bet (apostar), Call (igualar), Raise (subir) o Fold (retirarse)."},
      {title:"Jerarquía de manos",text:"De mayor a menor:\n1° Escalera real (A-K-Q-J-10 del mismo palo)\n2° Escalera de color (5 consecutivas del mismo palo)\n3° Póker (4 iguales)\n4° Full house (trío + par)\n5° Color (5 del mismo palo)\n6° Escalera (5 consecutivas)\n7° Trío (3 iguales)\n8° Doble par\n9° Par\n10° Carta más alta"},
      {title:"El Showdown",text:"Si quedan 2+ jugadores tras la última ronda de apuesta, muestran sus cartas. Gana la mejor mano. En caso de empate, el bote se divide."},
      {title:"Variantes comunes",text:"Texas Hold'em: la variante más popular, 2 cartas privadas + 5 comunitarias.\nOmaha: 4 cartas privadas, debés usar exactamente 2.\n5 Card Draw: 5 cartas privadas, podés cambiar hasta 3.\nStud: sin cartas comunitarias, algunas cartas son visibles para todos."},
    ]},
  {
    id:"blackjack", name:"Blackjack", emoji:"♣️", color:"var(--nomercy)",
    sections:[
      {title:"Objetivo",text:"Conseguir una mano con valor más cercano a 21 que la del crupier, sin pasarse. Si superás 21, perdés ('te pasás' o 'bust')."},
      {title:"Valor de las cartas",text:"• Números 2–10: valor nominal\n• Figuras (J, Q, K): 10 pts\n• As: 1 u 11 pts (el que más convenga)"},
      {title:"Desarrollo",text:"El crupier reparte 2 cartas a cada jugador y 2 para él (una boca arriba, una boca abajo). Cada jugador decide:\n• Hit: pedir otra carta\n• Stand: plantarse con las cartas actuales\n• Double Down: doblar la apuesta y recibir exactamente una carta más\n• Split: si tenés un par, dividirlo en dos manos (con apuesta igual)"},
      {title:"Blackjack",text:"Si tus dos primeras cartas son un As + carta de 10 puntos (10, J, Q, K), tenés 'Blackjack'. Ganás automáticamente 1.5x tu apuesta (salvo que el crupier también tenga Blackjack, en cuyo caso es empate)."},
      {title:"El crupier",text:"El crupier siempre debe pedir carta si tiene 16 o menos, y plantarse en 17 o más. Si el crupier se pasa de 21, todos los jugadores que no se hayan pasado ganan."},
      {title:"Resultados",text:"• Ganás: tu apuesta se duplica\n• Blackjack: ganás 1.5x la apuesta\n• Empate (push): recuperás tu apuesta\n• Perdés: el crupier se lleva tu apuesta"},
    ]},
  {
    id:"burako", name:"Burako", emoji:"🅱️", color:"#8E44AD",
    sections:[
      {title:"Objetivo",text:"Ser el primero en llegar a 2000 puntos acumulados. Se juega con 2 mazos de 106 cartas cada uno (2 barajas francesas con 2 comodines). Se puede jugar individual o por equipos de 2."},
      {title:"Preparación",text:"Se reparten 11 cartas a cada jugador. El resto forma el mazo. Hay un 'pozo' con 11 cartas boca abajo que se puede tomar bajo condiciones especiales."},
      {title:"Combinaciones",text:"• Escalera limpia: 3+ cartas consecutivas del mismo palo, sin comodines.\n• Escalera sucia: escalera con hasta 2 comodines (Joker o 2).\n• Burako limpio: escalera de 7+ cartas del mismo palo, sin comodines (+200 pts extra).\n• Burako sucio: escalera de 7+ cartas con comodines (+100 pts extra)."},
      {title:"El pozo",text:"Para tomar el pozo, debés tener en mano 2 cartas iguales a la carta visible del pozo (o un comodín + 1 igual). Al tomarlo, se agrega a tu mano y debés bajar al menos una combinación en ese turno."},
      {title:"Comodines",text:"Los Joker y los 2 son comodines. Un comodín puede reemplazar cualquier carta en una combinación sucia. En un Burako limpio no se usan. Si ya está en una jugada y conseguís la carta real, podés 'rescatar' el comodín para tu mano."},
      {title:"Puntuación",text:"Al terminar la ronda (alguien se queda sin cartas), se suman y restan puntos:\n\nSuman:\n• As: 15 pts\n• Joker: 40 pts\n• 2 (comodín): 20 pts\n• Figuras (J/Q/K): 10 pts\n• Números 4–7: 5 pts\n• Números 8–10: 10 pts\n\nRestan (cartas en mano sin bajar): valor negativo de cada carta.\nBurako limpio: +200 pts · Burako sucio: +100 pts · Salida sin comodines: +100 pts extra\nMeta: 2000 pts."},
    ]},
  {
    id:"racha_perdida", name:"Racha Perdida", emoji:"💀", color:"#6C3483",
    sections:[
      {title:"Objetivo",text:"Registrar quién rompió una racha activa y qué consecuencia (penitencia) debe cumplir. Es un sistema de rendición de cuentas entre amigos: si prometiste algo y fallaste, queda guardado para siempre."},
      {title:"¿Qué es una racha?",text:"Una racha es cualquier hábito o compromiso sostenido en el tiempo que el grupo decide registrar:\n• Rachas de apps (Duolingo, ejercicio, meditación)\n• Compromisos sociales (no tomar alcohol, no fumar, comer sano)\n• Desafíos grupales (ir al gimnasio X días, leer Y libros)\n• Cualquier cosa que se pueda romper"},
      {title:"Cómo registrar",text:"Cuando alguien rompe su racha:\n1. Abrí la app y entrá a Racha Perdida\n2. Seleccioná o escribí el nombre del perdedor\n3. Escribí el tipo de racha que rompió (ej: 'Duolingo', 'gimnasio')\n4. Definí la penitencia acordada por el grupo\n5. Confirmá el registro — queda guardado con fecha y hora"},
      {title:"Penitencias",text:"La penitencia la define el grupo antes o en el momento del registro. Puede ser:\n• Pagar algo (la próxima ronda, la cena, etc.)\n• Hacer algo ridículo o incómodo\n• Una prenda acordada de antemano\n• Lo que la creatividad del grupo dicte\n\nTip: las mejores penitencias son las que se definen ANTES de empezar la racha, así queda todo claro."},
      {title:"Stats",text:"La pestaña de estadísticas muestra:\n• Quién perdió más rachas en total\n• El historial de penitencias recientes\n• Porcentaje de pérdidas por jugador\n\nEs un registro permanente de la deshonra. Úsalo sabiamente."},
      {title:"Nota",text:"Este módulo está en desarrollo activo. El registro y las estadísticas son funcionales, pero puede haber cambios en futuras versiones. Si tenés sugerencias de mejora, usá la sección de Reportes en Info de la app."},
    ]},
  {
    id:"canasta", name:"Canasta", emoji:"🃏", color:"#C0392B",
    sections:[
      {title:"Objetivo",text:"Llegar primero a 5000 puntos acumulados. Se puede jugar en parejas (equipos) o individual con 2-4 jugadores. Se usa un doble mazo francés (108 cartas = 2 mazos de 52 + 4 comodines)."},
      {title:"Canastas",text:"Una canasta es un grupo de 7 o más cartas del mismo valor:\n• Canasta natural (pura): 7+ cartas del mismo valor, SIN comodines. Vale 500 pts.\n• Canasta mixta (sucia): 7+ cartas del mismo valor, CON comodines (máx 3). Vale 300 pts.\nCada equipo/jugador debe completar al menos 1 canasta antes de poder salir."},
      {title:"Comodines",text:"Los Jokers (valen 50 pts) y los 2 de cualquier palo (valen 20 pts) son comodines. Pueden sustituir cualquier carta en una canasta mixta. Los 3 negros son comodines especiales de 100 pts. Los 3 rojos bloquean el pozo temporalmente."},
      {title:"El pozo",text:"El pozo (descarte) puede tomarse si la carta visible se puede combinar con al menos 2 cartas iguales en tu mano (o 1 igual + 1 comodín). Al tomar el pozo, debés bajarlo todo en ese turno. El pozo congelado (tiene un 3 rojo o una carta girada) solo puede tomarse con 2 cartas naturales iguales."},
      {title:"Puntuación por ronda",text:"Al salir (quedarse sin cartas habiendo completado al menos 1 canasta), se suman las cartas bajadas y se restan las cartas en mano:\n• Joker: 50 pts · 2 (comodín): 20 pts · As: 15 pts\n• K/Q/J/10/9/8: 10 pts · 7/6/5/4: 5 pts · 3 negro: 100 pts\n• Canasta natural: +500 pts · Canasta mixta: +300 pts\n• Salida: +100 pts\nLas cartas que quedan en mano del equipo rival se restan."},
      {title:"Seguimiento en la app",text:"Ingresá el puntaje de cada mano manualmente. Los botones de acceso rápido (+100, +300, +500, -100, -300) agilizan el registro de canastas y penalizaciones. La app avisa automáticamente cuando se llega a los 5000 pts."},
    ]},
  {
    id:"sushi_do", name:"Sushi Do!", emoji:"🍣", color:"#D94841",
    sections:[
      {title:"Objetivo",text:"Ser el primero en llegar a 500 puntos completando sabores durante varias rondas."},
      {title:"Preparación",text:"Cada jugador arranca con 0 puntos. Antes de cada ronda se define qué sabores están en juego. La sugerencia base usa un sabor por jugador, pero el grupo puede ajustar la selección antes de empezar."},
      {title:"Cómo jugar",text:"En cada ronda, cuando un jugador junta 6 piezas del mismo sabor, grita 'Sushi Do!'. Si el llamado es correcto, gana los puntos de ese sabor y la ronda termina. Si el llamado fue incorrecto, recibe una penalización de 20 puntos y la ronda sigue abierta."},
      {title:"Puntuación",text:"Cada sabor vale una cantidad fija de puntos según su dificultad. Las rondas correctas suman esos puntos al jugador que cerró el sabor. Las penalizaciones por llamado incorrecto restan 20 puntos. La partida termina cuando alguien llega a 500 puntos o más."},
      {title:"Seguimiento en la app",text:"La app permite elegir los sabores de la partida, registrar quién gritó Sushi Do! y guardar la partida tanto al llegar naturalmente a 500 puntos como al cerrarla antes con la confirmación de final anticipado."},
    ]},
  {
    id:"portion_counter", name:"Contador de Porciones", emoji:"🍽️", color:"#1ABC9C",
    sections:[
      {title:"Objetivo",text:"Llevar la cuenta de cuántas unidades comió cada jugador de una comida elegida al inicio de la partida."},
      {title:"Preparación",text:"Cargá los jugadores y elegí exactamente una comida entre las opciones disponibles antes de empezar: sushi, pizza, hamburguesa, pancho, empanadas, facturas, sanguchitos o cookies."},
      {title:"Cómo jugar",text:"Una vez iniciada la partida, seleccioná un jugador y tocá el emoji central para sumarle una unidad. La comida elegida queda fija durante toda la partida y define el color y el ícono visibles en pantalla."},
      {title:"Puntuación",text:"Cada toque suma 1 unidad al jugador seleccionado. No hay meta fija: gana quien tenga el mayor total cuando el grupo decide guardar la partida."},
      {title:"Seguimiento en la app",text:"La app guarda la comida elegida junto con el resultado final para que el historial indique qué se estuvo contando en esa partida."},
    ]},
  {
    id:"basta_dym", name:"Basta!", emoji:"🔤", color:"#2F7DE1",
    sections:[
      {title:"Objetivo",text:"Ser la primera persona en conseguir 3 cartas de temática. Cada ronda usa una letra distinta y el ganador de la vuelta suma una carta para la temática actual."},
      {title:"Preparación",text:"Definan la temática en juego, preparen las categorías del mazo o tablero y tengan una hoja o superficie donde cada jugador pueda anotar sus respuestas. La app lleva el control de letras usadas y cartas ganadas."},
      {title:"Cómo jugar",text:"Al comenzar cada ronda se revela o se elige una letra. Todos escriben, al mismo tiempo, una respuesta por categoría que empiece con esa letra. Cuando alguien completa todas sus casillas, dice '¡Basta!' y detiene la ronda. Después se comparan las respuestas para validar cuáles cuentan y cuáles se anulan por repetición."},
      {title:"Puntuación",text:"La mesa puede seguir usando su sistema habitual para validar respuestas, pero en esta variante de seguimiento la app registra quién ganó cada ronda y le suma 1 carta de temática. Gana automáticamente quien llegue primero a 3 cartas."},
      {title:"Seguimiento en la app",text:"Elegí la temática actual, seleccioná una letra única entre la A y la Z, marcá quién ganó la vuelta y repetí. Cada letra queda bloqueada después de usarse. Cuando se agotan todas, podés tocar 'Otra vuelta!' para reiniciar el alfabeto y seguir hasta que alguien llegue a 3 cartas."},
    ]},
  {
    id:"ajedrez", name:"Ajedrez", emoji:"♟️", color:"#4A4A6A",
    sections:[
      {title:"Objetivo",text:"Poner al rey del oponente en jaque mate — una posición desde la cual no puede escapar. Se juega 1 contra 1 en un tablero de 8×8."},
      {title:"Las piezas",text:"Rey (♔): se mueve 1 casilla en cualquier dirección. Es la pieza más importante.\nDama (♕): se mueve cualquier cantidad de casillas en cualquier dirección.\nTorre (♖): se mueve cualquier cantidad de casillas en línea recta (horizontal o vertical).\nAlfil (♗): se mueve cualquier cantidad de casillas en diagonal. Cada alfil queda confinado a su color de casilla.\nCaballo (♘): se mueve en forma de 'L' (2+1 casillas). Es la única pieza que puede saltar sobre otras.\nPeón (♙): avanza 1 casilla hacia adelante (o 2 desde su posición inicial). Captura en diagonal."},
      {title:"Reglas especiales",text:"Enroque: el rey se mueve 2 casillas hacia una torre y la torre salta al otro lado. Solo es posible si ninguna de las dos piezas se ha movido antes, si el rey no está en jaque y si las casillas entre ellas están libres y no atacadas.\nCaptura al paso (En passant): si un peón avanza 2 casillas desde su posición inicial y queda al lado de un peón rival, ese peón rival puede capturarlo como si solo hubiera avanzado 1 casilla. Debe hacerse de inmediato, en el turno siguiente.\nPromoción: cuando un peón llega a la última fila, debe ser promovido a dama, torre, alfil o caballo (normalmente se elige la dama)."},
      {title:"Jaque y jaque mate",text:"Jaque: el rey está bajo ataque. El jugador DEBE salir del jaque en su siguiente turno (moviendo el rey, bloqueando el ataque o capturando la pieza atacante).\nJaque mate: el rey está en jaque y no hay ninguna manera legal de salir. El juego termina y el jugador que dio jaque mate gana.\nAhogado (Stalemate): el jugador no está en jaque pero no tiene ningún movimiento legal. Es empate."},
      {title:"Tablas (empate)",text:"Ahogado: sin movimientos legales pero sin jaque.\nRepetición triple: la misma posición se repite 3 veces.\nRegla de los 50 movimientos: 50 movimientos consecutivos sin capturas ni movimiento de peón.\nMaterial insuficiente: no es posible dar jaque mate con las piezas restantes.\nAcuerdo mutuo: ambos jugadores acuerdan tablas."},
      {title:"Seguimiento en la app",text:"La app registra quién gana cada partida en la sesión. Indicá el ganador de cada juego para llevar el historial y las estadísticas de victorias entre los jugadores."},
    ]},
  {
    id:"monopoly", name:"Monopoly", emoji:"🎩", color:"#E63946",
    sections:[
      {title:"Objetivo",text:"Ser el último jugador con dinero en el juego. Los demás deben declararse en bancarrota para que haya un ganador."},
      {title:"Preparación",text:"Cada jugador elige una ficha y recibe $1500. Se reparten las propiedades según el mazo de cartas o directamente en el tablero."},
      {title:"Turno",text:"Tirá los dados y mové tu ficha. Dependiendo donde caigas: comprá la propiedad si está disponible, pagá alquiler si pertenece a otro jugador, seguí instrucciones de la casilla."},
      {title:"Propiedades",text:"Podés comprar casas y hoteles cuando tenés el conjunto completo de un color. Cada mejora aumenta el alquiler."},
      {title:"Bancarrota",text:"Si debés más de lo que tenés, estás en bancarrota y quedás eliminado. Transferís todos tus activos al acreedor."},
      {title:"Seguimiento en la app",text:"Registrá el ganador de cada partida para llevar estadísticas de victorias entre los jugadores."},
    ]},
  {
    id:"life", name:"Life", emoji:"🚗", color:"#27AE60",
    sections:[
      {title:"Objetivo",text:"Acumular la mayor cantidad de dinero al retirarte. Gana quien tenga más dinero al jubilarse."},
      {title:"Preparación",text:"Cada jugador elige un auto. Se elige si ir a la universidad o comenzar a trabajar directamente. Cada jugador recibe $10,000 del banco."},
      {title:"Turno",text:"Girá la ruleta y avanzá el número de espacios. Seguí las instrucciones de cada casilla: casamiento, hijos, cambio de trabajo, cobros y pagos."},
      {title:"Eventos",text:"Casamiento: todos los jugadores te dan un regalo de bodas. Hijos: suman personitas al auto y pueden darte bonificaciones al final. Cambio de trabajo: podés aceptar o rechazar una nueva carta de carrera."},
      {title:"Final",text:"Al llegar al retiro, contás todo tu dinero (efectivo + préstamos devueltos + bonificaciones). El jugador con más dinero gana."},
      {title:"Seguimiento en la app",text:"Registrá el ganador de cada partida para llevar estadísticas de victorias entre los jugadores."},
    ]},
]

function getRulesData(t: (key: string) => string): RuleEntry[] {
  const TM = {
    "Blackjack": "rsBlackjack",
    "Bonificaciones de color": "rsColorBonus",
    "Cartas de acción": "rsActionCards",
    "Cartas especiales": "rsSpecialCards",
    "Chinchón": "rsChinchon",
    "Combinaciones": "rsCombos",
    "Comodines": "rsJokers",
    "Cómo cortar": "rsHowToClose",
    "Cómo jugar": "rsHowToPlay",
    "Cómo se juega": "rsHowToPlay2",
    "Desarrollo": "rsHandDev",
    "Doble generala": "rsDoubleGenerala",
    "Duración": "rsDuration",
    "El Envido": "rsEnvido",
    "El Showdown": "rsShowdown",
    "El Truco": "rsTruco",
    "El concepto Flip": "rsFlipConcept",
    "El crupier": "rsDealer",
    "El pozo": "rsThePot",
    "Fin de la ronda": "rsEndOfRound",
    "Fin del juego": "rsEndOfGame",
    "Final del turno": "rsEndOfTurn",
    "Generala servida": "rsServedGenerala",
    "Jerarquía de cartas": "rsCardRanking",
    "Jerarquía de manos": "rsHandRanking",
    "La Flor": "rsFlor",
    "Lado Claro — Cartas de acción": "rsLightSide",
    "Lado Oscuro — Cartas de acción": "rsDarkSide",
    "Las cartas": "rsCards",
    "Las letras": "rsLetters",
    "Materiales": "rsEquipment",
    "Números": "rsNumbers",
    "Objetivo": "rsObjective",
    "Preparación": "rsPrep",
    "Puntuación": "rsScoring",
    "Puntuación por ronda": "rsRoundScoring",
    "Regla DOS": "rsDosRule",
    "Reglas de la casa": "rsHouseRules",
    "Reglas especiales": "rsSpecialRules",
    "Resultados": "rsResults",
    "Rondas de apuesta": "rsBettingRounds",
    "Rummy": "rsRummy",
    "Seguimiento": "rsTracking",
    "Seguimiento en la app": "rsTracking",
    "Las piezas": "rsPieces",
    "Jaque y jaque mate": "rsCheckMate",
    "Tablas (empate)": "rsDraws",
    "Tipos de pareja": "rsPairTypes",
    "Táctica": "rsTactics",
    "Valor de las cartas": "rsHandValue",
    "Variante Texas Hold'em": "rsTexasHoldem",
    "Variante sin fichas": "rsNoTokens",
    "Variantes comunes": "rsCommonVariants",
    "Canastas": "rsCanastas",
    // Racha Perdida
    "¿Qué es una racha?": "rsWhatIsStreak",
    "Cómo registrar": "rsHowToRegister",
    "Penitencias": "rsPenalties",
    "Stats": "rsStats2",
    "Nota": "rsNote",
  };
  return RULES_DATA.map((game) => ({
    ...game,
    name: t(`gn_${game.id}`) || game.name,
    sections: game.sections.map((s, i) => ({
      ...s,
      title: TM[s.title] ? t(TM[s.title]) || s.title : s.title,
      text: t(`r_${game.id}_${i}`) || s.text,
    })),
  }));
}

export { RULES_DATA, getRulesData };
