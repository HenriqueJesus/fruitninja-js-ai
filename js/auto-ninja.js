// Visual autoplay: decisions come from the rendered canvas, not Fruit objects.
(function () {
    var active = false;
    var background = new Image();
    var reference;
    var gameCanvas;
    var context;
    var capture;
    var lastSwing = 0;
    var status;
    var button;
    var lastTarget = null;
    var completedPoints = 0;
    var bestRound = 0;
    var completedRounds = 0;
    var recordedGameOver = false;
    var restartScheduled = false;
    var GRID = 3;
    var templates = [];
    var spriteNames = ['boom'];

    background.src = 'images/background.jpg';
    spriteNames.forEach(function (name) {
        var image = new Image();
        image.onload = function () {
            for (var size = 40; size <= 64; size += 4) {
                var canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                var ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(image, 0, 0, size, size);
                var data = ctx.getImageData(0, 0, size, size).data;
                var samples = [];
                var minX = size, minY = size;
                for (var y = 2; y < size - 2; y += 4) {
                    for (var x = 2; x < size - 2; x += 4) {
                        var index = (y * size + x) * 4;
                        if (data[index + 3] < 245) continue;
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        if (x % 8 === 2 && y % 8 === 2) {
                            samples.push({ x: x, y: y, r: data[index], g: data[index + 1], b: data[index + 2] });
                        }
                    }
                }
                templates.push({ name: name, size: size, minX: minX, minY: minY, samples: samples });
            }
        };
        image.src = 'images/' + name + '.png';
    });

    function makeControls() {
        var panel = document.createElement('div');
        panel.style.cssText = 'box-sizing:border-box;display:flex;align-items:center;gap:12px;width:calc(100% - 24px);max-width:800px;margin:8px auto;background:#19140de8;color:white;padding:8px 12px;border-radius:8px;font:14px Arial,sans-serif;text-align:left';
        button = document.createElement('button');
        button.textContent = 'Ativar IA';
        button.style.cssText = 'flex:none;cursor:pointer;padding:7px 12px;font-weight:bold';
        status = document.createElement('div');
        status.style.cssText = 'flex:1;min-width:0;overflow-wrap:anywhere';
        status.textContent = 'Aguardando';
        button.addEventListener('click', function () {
            if (!gameCanvas || !reference) return;
            if (lives <= 0) {
                if (active) {
                    active = false;
                    button.textContent = 'Reiniciar com IA';
                    status.textContent = 'IA pausada | total: ' + completedPoints;
                    return;
                }
                restartRound();
            }
            active = !active;
            button.textContent = active ? 'Pausar IA' : 'Ativar IA';
            if (active && !isPlay && lives > 0) {
                start.play();
                isPlay = true;
            }
            status.textContent = active ? 'Procurando frutas...' : 'IA pausada';
        });
        panel.appendChild(button);
        panel.appendChild(status);
        document.body.appendChild(panel);
    }

    function restartRound() {
        score = 0;
        lives = 3;
        fruit = [];
        x = 0;
        isPlay = true;
        lastTarget = null;
        recordedGameOver = false;
        restartScheduled = false;
        loop();
    }

    function prepare() {
        gameCanvas = document.querySelector('canvas');
        if (!gameCanvas || !background.complete || !background.naturalWidth) return false;
        capture = document.createElement('canvas');
        capture.width = 800;
        capture.height = 635;
        context = capture.getContext('2d', { willReadFrequently: true });
        var canvas = document.createElement('canvas');
        canvas.width = capture.width;
        canvas.height = capture.height;
        var bgContext = canvas.getContext('2d', { willReadFrequently: true });
        bgContext.drawImage(background, 0, 0, canvas.width, canvas.height);
        reference = bgContext.getImageData(0, 0, canvas.width, canvas.height).data;
        return true;
    }

    function findObjects(pixels, width, height) {
        var cols = Math.ceil(width / GRID);
        var rows = Math.ceil(height / GRID);
        var mask = new Uint8Array(cols * rows);
        var visited = new Uint8Array(mask.length);
        var x, y, cell, index, difference;

        for (y = 27; y < rows - 2; y++) {
            for (x = 3; x < cols - 3; x++) {
                if (y < 30 && (x < 35 || x > cols - 40)) continue;
                index = ((y * GRID) * width + x * GRID) * 4;
                difference = Math.abs(pixels[index] - reference[index]) +
                    Math.abs(pixels[index + 1] - reference[index + 1]) +
                    Math.abs(pixels[index + 2] - reference[index + 2]);
                if (difference > 95) mask[y * cols + x] = 1;
            }
        }

        var objects = [];
        for (cell = 0; cell < mask.length; cell++) {
            if (!mask[cell] || visited[cell]) continue;
            var queue = [cell];
            var head = 0;
            var count = 0;
            var minX = cols, maxX = 0, minY = rows, maxY = 0;
            var red = 0, dark = 0, colorful = 0;
            visited[cell] = 1;

            while (head < queue.length) {
                var current = queue[head++];
                var cx = current % cols;
                var cy = (current / cols) | 0;
                count++;
                minX = Math.min(minX, cx);
                maxX = Math.max(maxX, cx);
                minY = Math.min(minY, cy);
                maxY = Math.max(maxY, cy);
                var pixel = ((cy * GRID) * width + cx * GRID) * 4;
                var r = pixels[pixel], g = pixels[pixel + 1], b = pixels[pixel + 2];
                if (r > 105 && r > g * 1.6 && r > b * 1.5) red++;
                if (r < 80 && g < 80 && b < 80) dark++;
                if (Math.max(r, g, b) - Math.min(r, g, b) > 65 && Math.max(r, g, b) > 130) colorful++;

                var neighbors = [current - 1, current + 1, current - cols, current + cols];
                for (var n = 0; n < neighbors.length; n++) {
                    var next = neighbors[n];
                    if (next < 0 || next >= mask.length || visited[next] || !mask[next]) continue;
                    if (Math.abs(next % cols - cx) > 1) continue;
                    visited[next] = 1;
                    queue.push(next);
                }
            }

            if (count < 18 || count > 700 || maxX - minX < 5 || maxY - minY < 5) continue;
            objects.push({
                x: (minX + maxX) * GRID / 2,
                y: (minY + maxY) * GRID / 2,
                left: minX * GRID,
                top: minY * GRID,
                width: (maxX - minX) * GRID,
                height: (maxY - minY) * GRID,
                size: Math.max(maxX - minX, maxY - minY) * GRID,
                bomb: dark / count > 0.27 && red / count > 0.04,
                colorful: colorful / count,
                count: count
            });
        }
        return objects;
    }

    function identify(object, pixels, width, height) {
        var best = null;
        templates.forEach(function (template) {
            if (!template.samples.length || Math.abs(object.size - template.size) > 22) return;
            var baseX = object.left - template.minX;
            var baseY = object.top - template.minY;
            for (var dy = -6; dy <= 6; dy += 3) {
                for (var dx = -6; dx <= 6; dx += 3) {
                    var x0 = baseX + dx;
                    var y0 = baseY + dy;
                    if (x0 < 0 || y0 < 0 || x0 + template.size >= width || y0 + template.size >= height) continue;
                    var error = 0;
                    for (var i = 0; i < template.samples.length; i++) {
                        var sample = template.samples[i];
                        var index = ((y0 + sample.y) * width + x0 + sample.x) * 4;
                        error += Math.abs(pixels[index] - sample.r) +
                            Math.abs(pixels[index + 1] - sample.g) +
                            Math.abs(pixels[index + 2] - sample.b);
                    }
                    error /= template.samples.length * 3;
                    if (!best || error < best.error) {
                        best = { name: template.name, error: error, x: x0, y: y0, size: template.size };
                    }
                }
            }
        });
        return best && best.error < 30 ? best : null;
    }

    function tick() {
        if (!gameCanvas && !prepare()) return;
        if (lives <= 0) {
            if (!recordedGameOver) {
                completedPoints += score;
                bestRound = Math.max(bestRound, score);
                completedRounds++;
                recordedGameOver = true;
            }
            if (active && !restartScheduled) {
                restartScheduled = true;
                setTimeout(function () {
                    if (active && lives <= 0) restartRound();
                    restartScheduled = false;
                }, 1500);
            }
            button.textContent = active ? 'Pausar IA' : 'Reiniciar com IA';
            status.textContent = active ? 'Nova rodada em instantes | total: ' + completedPoints :
                'Fim de jogo | total: ' + completedPoints + ' | recorde: ' + bestRound;
            return;
        }
        if (!active || !isPlay) return;
        context.drawImage(gameCanvas, 0, 0, capture.width, capture.height);
        var pixels = context.getImageData(0, 0, capture.width, capture.height).data;
        var objects = findObjects(pixels, capture.width, capture.height);
        var bombs = objects.filter(function (object) {
            return object.bomb || !!identify(object, pixels, capture.width, capture.height);
        });
        var fruits = objects.filter(function (object) {
            return !bombs.includes(object) && object.colorful > 0.25 &&
                object.width >= 30 && object.height >= 30 && object.size <= 80 &&
                object.y > 90 && object.y < capture.height - 20 &&
                !bombs.some(function (bomb) {
                    return Math.hypot(object.x - bomb.x, object.y - bomb.y) < 95;
                });
        });
        status.textContent = 'Rodada ' + (completedRounds + 1) + ' | pontos: ' + score +
            ' | total: ' + (completedPoints + score) + ' | vidas: ' + lives +
            ' | frutas: ' + fruits.length + ' | bombas: ' + bombs.length;
        if (performance.now() - lastSwing < 45 || !fruits.length) return;
        fruits.sort(function (a, b) { return b.y - a.y; });
        var target = fruits[0];
        if (lastTarget && Math.hypot(target.x - lastTarget.x, target.y - lastTarget.y) < 22 &&
                performance.now() - lastTarget.at < 100) return;
        sword.swipe(target.x - 5, target.y);
        sword.swipe(target.x + 5, target.y);
        lastSwing = performance.now();
        lastTarget = { x: target.x, y: target.y, at: lastSwing };
    }

    makeControls();
    setInterval(tick, 45);
})();
