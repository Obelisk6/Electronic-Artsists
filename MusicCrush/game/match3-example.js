//Функциятя заработва когато всичко е заредено
window.onload = function() {
    // изгражда фона и мрежата(решетката)
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");
    
    // FPS
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;
    
    // Управление с мишка
    var drag = false;
    
    // Параметри на елементите, които местим
    var level = {
        x: 250,         // позиция на X
        y: 113,         // позиция на Y 
        columns: 8,     // Брой колони
        rows: 8,        // Брой редове
        tilewidth: 40,  // Размери на ширина на квадратче
        tileheight: 40, // Размери на височина на квадратче
        tiles: [],      // Двумерен масив от квадратчета
        selectedtile: { selected: false, column: 0, row: 0 }
    };
    
    // Всички различни цветове на квадратчетата в RGB
    var tilecolors = [[250, 128, 128],
                      [200, 255, 128],
                      [150, 128, 255],
                      [100, 255, 128],
                      [50, 128, 255],
                      [0, 255, 255],
                      [75, 200, 200]];
    
    // Разпознаваеми групи и движения
    var clusters = [];  
    var moves = [];     

    // Текущо движение
    var currentmove = { column1: 0, row1: 0, column2: 0, row2: 0 };
    
    // Състояние на играта
    var gamestates = { init: 0, ready: 1, resolve: 2 };
    var gamestate = gamestates.init;
    
    // Резултат
    var score = 0;
    
    // Промени на анимацията
    var animationstate = 0;
    var animationtime = 0;
    var animationtimetotal = 0.3;
    
    // Показва възможно движение
    var showmoves = false;
    
    // Бота
    var aibot = false;
    
    // "Game over"
    var gameover = false;
    
    // Всички бутони
    var buttons = [ { x: 30, y: 240, width: 150, height: 50, text: "New Game"},
                    { x: 30, y: 300, width: 150, height: 50, text: "Noob Mode"},
                    { x: 30, y: 360, width: 150, height: 50, text: "On AI Bot"}];
    
    // Начало на играта
    function init() {
        // Движения на мишката
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseout", onMouseOut);
        
        // Използване на двумерения масив
        for (var i=0; i<level.columns; i++) {
            level.tiles[i] = [];
            for (var j=0; j<level.rows; j++) {
                // Дефиниране на типа на квадратчетата 
                level.tiles[i][j] = { type: 0, shift:0 }
            }
        }
        
        // "New game"
        newGame();
        
        // Въвеждане на главен цикъл
        main(0);
    }
    
    // Главен цикъл
    function main(tframe) {
        window.requestAnimationFrame(main);
        
        update(tframe);
        render();
    }
    
    // Обновяване  на инфото за играта
    function update(tframe) {
        var dt = (tframe - lastframe) / 1000;
        lastframe = tframe;
        
        updateFps(dt);
        
        if (gamestate == gamestates.ready) {
            // Тук играта вече може да се играе
            
            if (moves.length <= 0) {
                gameover = true;
            }
            
            // Бота да направи движение ако то е възможно
            if (aibot) {
                animationtime += dt;
                if (animationtime > animationtimetotal) {
                    // Проверка дали има възможни движения
                    findMoves();
                    
                    if (moves.length > 0) {
                        // Случайно възможно движение
                        var move = moves[Math.floor(Math.random() * moves.length)];
                        
                        // Симулира движение на мишката
                        mouseSwap(move.column1, move.row1, move.column2, move.row2);
                    } else {

                        newGame();
                    }
                    animationtime = 0;
                }
            }
        } else if (gamestate == gamestates.resolve) {
            animationtime += dt;
            
            if (animationstate == 0) {
                // Намира и изчиства натрупвания
                if (animationtime > animationtimetotal) {    
                    findClusters();
                    
                    if (clusters.length > 0) {
                        // Добавя точки към резултата
                        for (var i=0; i<clusters.length; i++) {
                            // Добавя допълнителни точки за по-дълги струпваня
                            score += 100 * (clusters[i].length - 2);
                            if (score >= 5000) {
                                alert('YOU WIN!');
                                window.location.href = 'Inventory.html';
                                //newGame();
                            }
                        }
                        removeClusters();
                
                        animationstate = 1;
                    } else {
                        // Когато свършат струпванията можеш да играеш
                        gamestate = gamestates.ready;
                    }
                    animationtime = 0;
                }
            } else if (animationstate == 1) {
                if (animationtime > animationtimetotal) {
                    // мести квадратчетата
                    shiftTiles();
                    
                    animationstate = 0;
                    animationtime = 0;
                    
                    // Намиране на нови струпвания
                    findClusters();
                    if (clusters.length <= 0) {
                        gamestate = gamestates.ready;
                    }
                }
            } else if (animationstate == 2) {
                if (animationtime > animationtimetotal) {
                    // Разменяне на квадратчетата
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    
                    // Проверка дали разместването е направило струпване
                    findClusters();
                    if (clusters.length > 0) {
                        animationstate = 0;
                        animationtime = 0;
                        gamestate = gamestates.resolve;
                    } else {
                        // Ако няма струпване връща квадратчето в предишната му позиция
                        animationstate = 3;
                        animationtime = 0;
                    }
                    
                    findMoves();
                    findClusters();
                }
            } else if (animationstate == 3) {
                // Връща анимацията една стъпка назад
                if (animationtime > animationtimetotal) {
                    // Невлидно разместване се връща обратно
                    swap(currentmove.column1, currentmove.row1, currentmove.column2, currentmove.row2);
                    
                    gamestate = gamestates.ready;
                }
            }
            
            findMoves();
            findClusters();
        }
    }
    
    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Изчислява fps
            fps = Math.round(framecount / fpstime);
            
            // Нулира времето и framecount
            fpstime = 0;
            framecount = 0;
        }
        
        // Увеличава времето и framecount
        fpstime += dt;
        framecount++;
    }
    
    // Draw text that is centered
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);
    }
    
    function render() {
        drawFrame();
    
        context.fillStyle = "#000000";
        context.font = "24px Verdana";
        drawCenterText("Score:", 30, level.y+40, 150);
        drawCenterText(score, 30, level.y+70, 150);
        
        drawButtons();
        
        var levelwidth = level.columns * level.tilewidth;
        var levelheight = level.rows * level.tileheight;
        context.fillStyle = "#000000";
        context.fillRect(level.x - 4, level.y - 4, levelwidth + 8, levelheight + 8);
        
        renderTiles();
        
        renderClusters();
        
        if (showmoves && clusters.length <= 0 && gamestate == gamestates.ready) {
            renderMoves();
        }
        
        if (gameover) {
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(level.x, level.y, levelwidth, levelheight);
            
            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            drawCenterText("Game Over!", level.x, level.y + levelheight / 2 + 10, levelwidth);
        }
    }
    
    function drawFrame() {
        context.fillStyle = "#d0d0d0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#e8eaec";
        context.fillRect(1, 1, canvas.width-2, canvas.height-2);
        
        context.fillStyle = "#303030";
        context.fillRect(0, 0, canvas.width, 65);
        
        context.fillStyle = "#ffffff";
        context.font = "24px Verdana";
        context.fillText("HackTUES Game", 10, 30);
        
        context.fillStyle = "#ffffff";
        context.font = "12px Verdana";
        context.fillText("Fps: " + fps, 13, 50);
    }
    
    function drawButtons() {
        for (var i=0; i<buttons.length; i++) {

            context.fillStyle = "#000000";
            context.fillRect(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height);
            
            context.fillStyle = "#ffffff";
            context.font = "18px Verdana";
            var textdim = context.measureText(buttons[i].text);
            context.fillText(buttons[i].text, buttons[i].x + (buttons[i].width-textdim.width)/2, buttons[i].y+30);
        }
    }
    
    function renderTiles() {
        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows; j++) {
                var shift = level.tiles[i][j].shift;
                
                var coord = getTileCoordinate(i, j, 0, (animationtime / animationtimetotal) * shift);
                
                if (level.tiles[i][j].type >= 0) {

                    var col = tilecolors[level.tiles[i][j].type];
                    
                    drawTile(coord.tilex, coord.tiley, col[0], col[1], col[2]);
                }
                
                if (level.selectedtile.selected) {
                    if (level.selectedtile.column == i && level.selectedtile.row == j) {

                        drawTile(coord.tilex, coord.tiley, 255, 0, 0);
                    }
                }
            }
        }
        
        if (gamestate == gamestates.resolve && (animationstate == 2 || animationstate == 3)) {

            var shiftx = currentmove.column2 - currentmove.column1;
            var shifty = currentmove.row2 - currentmove.row1;

            var coord1 = getTileCoordinate(currentmove.column1, currentmove.row1, 0, 0);
            var coord1shift = getTileCoordinate(currentmove.column1, currentmove.row1, (animationtime / animationtimetotal) * shiftx, (animationtime / animationtimetotal) * shifty);
            var col1 = tilecolors[level.tiles[currentmove.column1][currentmove.row1].type];
            
            var coord2 = getTileCoordinate(currentmove.column2, currentmove.row2, 0, 0);
            var coord2shift = getTileCoordinate(currentmove.column2, currentmove.row2, (animationtime / animationtimetotal) * -shiftx, (animationtime / animationtimetotal) * -shifty);
            var col2 = tilecolors[level.tiles[currentmove.column2][currentmove.row2].type];
            
            drawTile(coord1.tilex, coord1.tiley, 0, 0, 0);
            drawTile(coord2.tilex, coord2.tiley, 0, 0, 0);
            
            if (animationstate == 2) {

                drawTile(coord1shift.tilex, coord1shift.tiley, col1[0], col1[1], col1[2]);
                drawTile(coord2shift.tilex, coord2shift.tiley, col2[0], col2[1], col2[2]);
            } else {

                drawTile(coord2shift.tilex, coord2shift.tiley, col2[0], col2[1], col2[2]);
                drawTile(coord1shift.tilex, coord1shift.tiley, col1[0], col1[1], col1[2]);
            }
        }
    }
    
    function getTileCoordinate(column, row, columnoffset, rowoffset) {
        var tilex = level.x + (column + columnoffset) * level.tilewidth;
        var tiley = level.y + (row + rowoffset) * level.tileheight;
        return { tilex: tilex, tiley: tiley};
    }
    
    function drawTile(x, y, r, g, b) {
        context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        context.fillRect(x + 2, y + 2, level.tilewidth - 4, level.tileheight - 4);
        
        var imageObj = new Image();

        switch (r) {
            case 250: imageObj.src = 'D:\\HackTues3\\vsichkoo\\Electronic-Artsists-master\\MusicCrush\\game\\bobi_.png'; break;
            case 200: imageObj.src = 'D:\\HackTues3\\vsichkoo\\Electronic-Artsists-master\\MusicCrush\\game\\AC_.png'; break;
            case 150: imageObj.src = 'D:\\HackTues3\\vsichkoo\\Electronic-Artsists-master\\MusicCrush\\game\\ressistor.png'; break;
            case 100: imageObj.src = 'D:\\HackTues3\\vsichkoo\\Electronic-Artsists-master\\MusicCrush\\game\\cap_.png'; break;
            case 50: imageObj.src = 'D:\\HackTues3\\vsichkoo\\Electronic-Artsists-master\\MusicCrush\\game\\diode_.png'; break;
            case 0: imageObj.src = 'D:\\HackTues3\\vsichkoo\\Electronic-Artsists-master\\MusicCrush\\game\\trans_.png'; break;
            case 75: imageObj.src = 'D:\\HackTues3\\vsichkoo\\Electronic-Artsists-master\\MusicCrush\\game\\grn_.png'; break;
        }
      
        context.drawImage(imageObj, x + 6, y + 6);
      
      
    
    }
    
    function renderClusters() {
        for (var i=0; i<clusters.length; i++) {

            var coord = getTileCoordinate(clusters[i].column, clusters[i].row, 0, 0);
            
            if (clusters[i].horizontal) {

                context.fillStyle = "#00ff00";
                context.fillRect(coord.tilex + level.tilewidth/2, coord.tiley + level.tileheight/2 - 4, (clusters[i].length - 1) * level.tilewidth, 8);
            } else {

                context.fillStyle = "#0000ff";
                context.fillRect(coord.tilex + level.tilewidth/2 - 4, coord.tiley + level.tileheight/2, 8, (clusters[i].length - 1) * level.tileheight);
            }
        }
    }
    
    function renderMoves() {
        for (var i=0; i<moves.length; i++) {
 
            var coord1 = getTileCoordinate(moves[i].column1, moves[i].row1, 0, 0);
            var coord2 = getTileCoordinate(moves[i].column2, moves[i].row2, 0, 0);
            
            context.strokeStyle = "#ff0000";
            context.beginPath();
            context.moveTo(coord1.tilex + level.tilewidth/2, coord1.tiley + level.tileheight/2);
            context.lineTo(coord2.tilex + level.tilewidth/2, coord2.tiley + level.tileheight/2);
            context.stroke();
        }
    }
    
    function newGame() {

        score = 0;
        
        gamestate = gamestates.ready;
        
        gameover = false;
        
        createLevel();
        
        findMoves();
        findClusters(); 
    }
    
    function createLevel() {
        var done = false;
        
        while (!done) {
        
            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    level.tiles[i][j].type = getRandomTile();
                }
            }
            
            resolveClusters();
            
            findMoves();
            
            if (moves.length > 0) {
                done = true;
            }
        }
    }
    
    function getRandomTile() {
        return Math.floor(Math.random() * tilecolors.length);
    }
    
    function resolveClusters() {

        findClusters();
        
        while (clusters.length > 0) {
        
            removeClusters();
            
            shiftTiles();
            
            findClusters();
        }
    }
    
    function findClusters() {

        clusters = []
        
        for (var j=0; j<level.rows; j++) {

            var matchlength = 1;
            for (var i=0; i<level.columns; i++) {
                var checkcluster = false;
                
                if (i == level.columns-1) {

                    checkcluster = true;
                } else {

                    if (level.tiles[i][j].type == level.tiles[i+1][j].type &&
                        level.tiles[i][j].type != -1) {

                        matchlength += 1;
                    } else {

                        checkcluster = true;
                    }
                }
                
                if (checkcluster) {
                    if (matchlength >= 3) {

                        clusters.push({ column: i+1-matchlength, row:j,
                                        length: matchlength, horizontal: true });
                    }
                    
                    matchlength = 1;
                }
            }
        }

        for (var i=0; i<level.columns; i++) {

            var matchlength = 1;
            for (var j=0; j<level.rows; j++) {
                var checkcluster = false;
                
                if (j == level.rows-1) {

                    checkcluster = true;
                } else {

                    if (level.tiles[i][j].type == level.tiles[i][j+1].type &&
                        level.tiles[i][j].type != -1) {

                        matchlength += 1;
                    } else {

                        checkcluster = true;
                    }
                }
                
                if (checkcluster) {
                    if (matchlength >= 3) {

                        clusters.push({ column: i, row:j+1-matchlength,
                                        length: matchlength, horizontal: false });
                    }
                    
                    matchlength = 1;
                }
            }
        }
    }
    

    function findMoves() {

        moves = []
        
        for (var j=0; j<level.rows; j++) {
            for (var i=0; i<level.columns-1; i++) {

                swap(i, j, i+1, j);
                findClusters();
                swap(i, j, i+1, j);
                

                if (clusters.length > 0) {

                    moves.push({column1: i, row1: j, column2: i+1, row2: j});
                }
            }
        }
        

        for (var i=0; i<level.columns; i++) {
            for (var j=0; j<level.rows-1; j++) {

                swap(i, j, i, j+1);
                findClusters();
                swap(i, j, i, j+1);
                
                if (clusters.length > 0) {

                    moves.push({column1: i, row1: j, column2: i, row2: j+1});
                }
            }
        }
        
        clusters = []
    }
    
    function loopClusters(func) {
        for (var i=0; i<clusters.length; i++) {

            var cluster = clusters[i];
            var coffset = 0;
            var roffset = 0;
            for (var j=0; j<cluster.length; j++) {
                func(i, cluster.column+coffset, cluster.row+roffset, cluster);
                
                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }
    
    function removeClusters() {

        loopClusters(function(index, column, row, cluster) { level.tiles[column][row].type = -1; });

        for (var i=0; i<level.columns; i++) {
            var shift = 0;
            for (var j=level.rows-1; j>=0; j--) {

                if (level.tiles[i][j].type == -1) {

                    shift++;
                    level.tiles[i][j].shift = 0;
                } else {

                    level.tiles[i][j].shift = shift;
                }
            }
        }
    }
    

    function shiftTiles() {

        for (var i=0; i<level.columns; i++) {
            for (var j=level.rows-1; j>=0; j--) {

                if (level.tiles[i][j].type == -1) {

                    level.tiles[i][j].type = getRandomTile();
                } else {

                    var shift = level.tiles[i][j].shift;
                    if (shift > 0) {
                        swap(i, j, i, j+shift)
                    }
                }
                
                level.tiles[i][j].shift = 0;
            }
        }
    }
    
    function getMouseTile(pos) {

        var tx = Math.floor((pos.x - level.x) / level.tilewidth);
        var ty = Math.floor((pos.y - level.y) / level.tileheight);
        
        if (tx >= 0 && tx < level.columns && ty >= 0 && ty < level.rows) {

            return {
                valid: true,
                x: tx,
                y: ty
            };
        }
        
        return {
            valid: false,
            x: 0,
            y: 0
        };
    }
    
    function canSwap(x1, y1, x2, y2) {

        if ((Math.abs(x1 - x2) == 1 && y1 == y2) ||
            (Math.abs(y1 - y2) == 1 && x1 == x2)) {
            return true;
        }
        
        return false;
    }
    
    function swap(x1, y1, x2, y2) {
        var typeswap = level.tiles[x1][y1].type;
        level.tiles[x1][y1].type = level.tiles[x2][y2].type;
        level.tiles[x2][y2].type = typeswap;
    }
    
    function mouseSwap(c1, r1, c2, r2) {

        currentmove = {column1: c1, row1: r1, column2: c2, row2: r2};
    
        level.selectedtile.selected = false;
        
        animationstate = 2;
        animationtime = 0;
        gamestate = gamestates.resolve;
    }
    
    function onMouseMove(e) {

        var pos = getMousePos(canvas, e);
        
        if (drag && level.selectedtile.selected) {

            mt = getMouseTile(pos);
            if (mt.valid) {
                
                if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)){

                    mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                }
            }
        }
    }
    
    function onMouseDown(e) {

        var pos = getMousePos(canvas, e);
        
        if (!drag) {

            mt = getMouseTile(pos);
            
            if (mt.valid) {

                var swapped = false;
                if (level.selectedtile.selected) {
                    if (mt.x == level.selectedtile.column && mt.y == level.selectedtile.row) {

                        level.selectedtile.selected = false;
                        drag = true;
                        return;
                    } else if (canSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row)){

                        mouseSwap(mt.x, mt.y, level.selectedtile.column, level.selectedtile.row);
                        swapped = true;
                    }
                }
                
                if (!swapped) {

                    level.selectedtile.column = mt.x;
                    level.selectedtile.row = mt.y;
                    level.selectedtile.selected = true;
                }
            } else {

                level.selectedtile.selected = false;
            }


            drag = true;
        }
        
        for (var i=0; i<buttons.length; i++) {
            if (pos.x >= buttons[i].x && pos.x < buttons[i].x+buttons[i].width &&
                pos.y >= buttons[i].y && pos.y < buttons[i].y+buttons[i].height) {
                
                if (i == 0) {

                    newGame();
                } else if (i == 1) {

                    showmoves = !showmoves;
                    buttons[i].text = (showmoves?"Hide":"Show") + " Moves";
                } else if (i == 2) {

                    aibot = !aibot;
                    buttons[i].text = (aibot?"Off":"On") + " AI Bot";
                }
            }
        }
    }
    
    function onMouseUp(e) {

        drag = false;
    }
    
    function onMouseOut(e) {

        drag = false;
    }
    
    function getMousePos(canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }
    
    init();
};