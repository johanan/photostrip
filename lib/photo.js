function quickGetJSON(url, callback, error)
{
    var request = new XMLHttpRequest();
    request.onreadystatechange = function()
    {
        if (request.readyState === 4 && request.status === 200)
        {
            callback(JSON.parse(request.responseText));
        }

        if (request.readyState === 4 && request.status !== 200)
        {
            if (error !== undefined)
            {
                error(request.responseText);
            }
        }
    };
    request.open('GET', url, true);
    request.send();
}

var requestAnimFrame = (function(){
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

function NewCanvas(width, height, fill){
    var canv = document.createElement('canvas');
    canv.width = width;
    canv.height = height;
    var cb_ctx = canv.getContext('2d');
    cb_ctx.fillStyle = fill;
    cb_ctx.fillRect(0,0, width, height);

    return canv;
}

(function(Josh){
    Josh.LayeredCanvas = function LayeredCanvas(finalCanvas){
        this.final = finalCanvas;
        this.layers = [];
        this.layerHash = {};
        this.ctx = this.final.getContext('2d');
    };

    Josh.LayeredCanvas.prototype = {
        addLayer: function(el, name){
            this.layers.push(el);
            this.layerHash[name] = this.layers.length - 1;

            return this.layers[this.layers.length];
        },

        getLayerByName: function(name){
            return this.layers[this.layerHash[name]];
        },

        render: function(){
            for(var i=0; i<this.layers.length;i++)
            {
                this.layers[i].update();
                this.ctx.drawImage(this.layers[i].el, this.layers[i].x, this.layers[i].y);
            }
        },

        getPNG: function getPNG() {
            return this.final.toDataURL();
        },

        getJPG: function getJPG(quality) {
            return this.final.toDataURL('image/jpeg', quality);
        },

        resetLayers: function resetLayers() {
            for(var i=0; i<this.layers.length;i++)
            {
                this.layers[i].done = false;
                this.layers[i].renderOnce = false;
            }
        }
    };
})(window.Josh = window.Josh || {});

(function(Josh){
    Josh.Layer = function Layer(el, dx, dy){
        this.el = el;
        this.width = el.width;
        this.height = el.height;
        this.x = dx;
        this.y = dy;
        this.done = false;
        this.draw = function(){};
        this.ctx = this.el.getContext('2d');
        this.renderOnce = false;
    };

    Josh.Layer.prototype = {
        update: function update(){
            if (!this.done && !this.renderOnce) {
                this.draw.apply(this.el, [this.ctx]);
            }else if (this.renderOnce) {
                this.draw.apply(this.el, [this.ctx]);
                this.done = true;
                this.renderOnce = false;
            }
        },

        addText: function addText(text, font, fontSize, x, y){
           this.renderOnce = false;
           this.ctx.font = fontSize + 'px "' + font + '"';
           this.ctx.fillStyle = "white";
           this.ctx.lineWidth = 10;
           this.ctx.miterLimit = 3;
           this.clearCanvas();
           this.ctx.strokeText(text, x, y);
           this.ctx.fillText(text, x, y);
           this.renderOnce = true;
        },

        addCenterText: function addCenterText(text, font, fontSize) {
            this.renderOnce = false;
           this.ctx.font = fontSize + 'px "' + font + '"';
           this.ctx.fillStyle = "white";
           this.ctx.lineWidth = 10;
           this.ctx.miterLimit = 3;
           this.ctx.textAlign = 'left';
           this.ctx.textBaseline = 'top';
           this.clearCanvas();
           this.wrapText(text, this.width, this.height, fontSize + 5);
           this.renderOnce = true;
        },

        addTextTopLeft: function addTextTopLeft(text, font, fontSize, x, y) {
            this.ctx.save();
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.addText(text, font, fontSize, x, y);
            this.ctx.restore();
        },

        addTextBottomRight: function addTextBottomRight(text, font, fontSize, x, y) {
            this.ctx.save();
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'bottom';
            this.addText(text, font, fontSize, x, y);
            this.ctx.restore();
        },

        wrapText: function wrapText(text, maxWidth, maxHeight, lineHeight) {
            var words = text.split(' ');
            var line = '';
            var lines = [];
            var maxComputedWidth = 0;
            var lastWidth = 0;

            for (var n =0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = this.ctx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    maxComputedWidth = lastWidth > maxComputedWidth? lastWidth : maxComputedWidth;

                    line = words[n] + ' ';
                }
                else {
                    line = testLine;
                    lastWidth = testWidth;
                }
            }

            if (maxComputedWidth === 0) {
                maxComputedWidth = lastWidth;
            }

            lines.push(line);

            //center test
            var centerWidth, centerHeight;
            centerWidth = (maxWidth - maxComputedWidth) / 2;
            centerHeight = (maxHeight - (lineHeight * lines.length)) / 2;

            for(var i=0;i<lines.length; i++) {
                this.ctx.strokeText(lines[i], centerWidth, centerHeight);
                this.ctx.fillText(lines[i], centerWidth, centerHeight);
                //I know this isn't perfect
                centerHeight += lineHeight;
            }
        },

        clearCanvas: function clearCanvas() {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
     };
})(window.Josh = window.Josh || {});

(function(Josh){
    var allow,
        canvas,
        canvas_container,
        ctx,
        layered,
        backCanvas,
        textCanvas,
        countDown,
        This,
        FullDraw,
        base,
        panel1,
        panel2,
        panel3,
        webcam,
        start,
        filters,
        fontList,
        greetings,
        backgrounds,
        drawBackground,
        drawBackgroundProxy,
        cd,
        text,
        panelCount,
        smile,
        photoCountDown,
        autoDownload,
        photoReset,
        photoCredits,
        buildPhotoCredit;

    Josh.AC = function AC(){
        "use strict";
        This = this;
        this.getSettings();
    };

    Josh.AC.prototype.getSettings = function getSettings(){
        var sett;
        if (location.hash !== "") {
            sett = location.hash.substring(1) + '.json';
        }else {
            sett = 'settings.json';
        }
        quickGetJSON(sett, function(d){
           This.settings = d;
           This.init();
        }, function(){
            quickGetJSON('settings.json', function(d){
               //something failed
               This.settings = d;
               This.init();
            });
        });
    };

    Josh.AC.prototype.init = function init(){
        //set everything up
        allow = document.getElementById('webcam-allow');
        canvas = document.getElementById('final');
        canvas_container = document.getElementById('canvas-container');
        ctx = canvas.getContext('2d');
        layered = new Josh.LayeredCanvas(canvas);
        base = new Josh.Layer(new NewCanvas(1190, 850, "rgb(255,255,255)"), 0, 0);
        panel1 = new Josh.Layer(new NewCanvas(540, 360, "rgb(0,0,0)"), 0, 0);
        panel2 = new Josh.Layer(new NewCanvas(640, 360,"rgb(0,0,0)"), 550, 0);
        panel3 = new Josh.Layer(new NewCanvas(640, 480, "rgb(0,0,0)"), 0, 370);
        backCanvas = new Josh.Layer(new NewCanvas(540, 480,"rgb(0,0,0)"), 650, 370);
        textCanvas = document.createElement('canvas');
        countDown = document.createElement('canvas');
        start = document.getElementById('start');
        filters = document.getElementById('filters');
        fontList = document.getElementById('fonts');
        greetings = document.getElementById('greetings');
        backgrounds = document.getElementById('backgrounds');
        photoCredits = document.getElementById('photo-credits');

        textCanvas.width = 540;
        textCanvas.height = 480;
        countDown.width = 1190;
        countDown.height = 850;

        layered.addLayer(base, 'Base');
        layered.addLayer(panel1, 'Panel1');
        layered.addLayer(panel2, 'Panel2');
        layered.addLayer(panel3, 'Panel3');
        layered.addLayer(backCanvas, 'Background');
        layered.addLayer(new Josh.Layer(textCanvas, 650, 370), 'Text');
        layered.addLayer(new Josh.Layer(countDown, 0, 0), 'CountDown');

        cd = layered.getLayerByName('CountDown');
        text = layered.getLayerByName('Text');


        //wire private functions
        FullDraw = function FullDraw()
        {
            layered.render();
            requestAnimFrame(FullDraw);
        };

        drawBackground = function drawBackground(img) {
            var ratio = img.width / backCanvas.width;
            backCanvas.ctx.drawImage(img, 0, 0, img.width / ratio, img.height / ratio) ;
            backCanvas.renderOnce = true;
        };

        drawBackgroundProxy = function drawBackgroundProxy(e) {
            //proxy so I don't dirty up the drawBackground function
            //and remove the listener
            drawBackground(e.target);
            e.target.removeEventListener('load', drawBackgroundProxy);
        };

        panelCount = function panelCount(count, panel) {
            if (panel === 1) {
                cd.addTextBottomRight(count +'', 'Griffy', 50, 510, 340);
            }
             if (panel === 2) {
                cd.addTextBottomRight(count +'', 'Griffy', 50, 1160, 340);
            }
             if (panel === 3) {
                cd.addTextBottomRight(count +'', 'Griffy', 50, 610, 840);
            }
        };

        smile = function smile() {
            cd.addText("\uf118", 'FontAwesome', 200, 520, 420);
        };

        photoCountDown = function photoCountDown(count, panel){
            if(count > 0 && panel <= 3) {
                panelCount(count, panel);
                count = count - 1;
                setTimeout(function() {photoCountDown(count, panel);}, 1000);
            }else{
                if (panel <= 3) {
                    smile();
                    webcam.update();
                    layered.getLayerByName('Panel' + panel).done = true;
                    panel += 1;
                    count = This.settings.photoTime;
                    setTimeout(function() {photoCountDown(count, panel);}, 1000);
                }else{
                    cd.addText('', 'Griffy', 10, 0, 0);
                    cd.clearCanvas();
                    layered.render();
                    autoDownload('PhotoDownload_' + (Math.floor(new Date().getTime() / 10000)) + '.jpg', layered.getJPG(0.9));
                    layered.getLayerByName('CountDown').addText('Please Wait', 'Griffy', 50, 450, 380);
                    setTimeout(photoReset, 3000);
                }
            }
        };

        autoDownload = function autoDownload(name, imageData) {
            var a = document.createElement('a');
                a.setAttribute('href', imageData);
                a.setAttribute('target', '_blank');
                a.setAttribute('download',  name);
                backgrounds.appendChild(a);
                var e = document.createEvent('MouseEvents');
                e.initEvent('click', true, true);
                a.dispatchEvent(e);
        };

        photoReset = function photoReset() {
            cd.clearCanvas();
            layered.resetLayers();
            start.classList.toggle('hidden');
        };

        buildPhotoCredit = function buildPhotoCredit(photo) {
            var li = document.createElement('li');
            var img = new Image();
            img.src = photo[0];
            li.appendChild(img);
            var a = document.createElement('a');
            a.href = photo[1].author.url;
            a.innerText = photo[1].author.name;
            a.target = "_blank";
            li.appendChild(a);
            photoCredits.appendChild(li);
        };

        webcam = wcvj.webcam('a', {glfx: true});
        webcam.video.addEventListener('canplay', function(){
            start.classList.toggle('hidden');
            allow.classList.add('hidden');
            cd.clearCanvas();

            function partial(ctx){
                ctx.drawImage(webcam.canvas, 50, 50, 540, 360, 0,0, 540, 360);
            }

            function full(ctx){
                ctx.drawImage(webcam.canvas, 0, 0);
            }

            panel1.draw = partial;
            panel2.draw = full;
            panel3.draw = full;
        });
        this.loadFonts(function(){
                This.setGreeting(This.settings.message);
            });
        this.loadFilters();
        this.loadBackgrounds();
        this.wireEvents();

        requestAnimFrame(FullDraw);
    };

    Josh.AC.prototype.changeGreetingText = function changeGreetingText(font, fontSize) {
        text.addCenterText(greetings.value, font, fontSize);
    };

    Josh.AC.prototype.loadFilters = function loadFilters() {
        for(var i=0; i<this.settings.filters.length; i++) {
            filters.options[filters.options.length] = new Option(this.settings.filters[i][1], i);
        }
    };

    Josh.AC.prototype.loadBackgrounds = function loadBackgrounds() {
        for (var i=0;i<this.settings.bgOptions.length;i++) {
            var li = document.createElement('li');
            var img = new Image();
            img.crossOrigin = '';
            img.src = this.settings.bgOptions[i][0];
            //load the first img into the canvas
            if (i === 0) {
                img.addEventListener('load', drawBackgroundProxy);
            }
            li.appendChild(img);
            backgrounds.appendChild(li);
            buildPhotoCredit(this.settings.bgOptions[i]);
        }
    };

    Josh.AC.prototype.loadFonts = function loadFonts(cb) {
        //this makes sure that the canvas can use the font
        for(var i=0;i<this.settings.fontOptions.length;i++)
        {
            var li = document.createElement('li');
            li.setAttribute('data-size', this.settings.fontOptions[i][1]);
            li.setAttribute('style', 'font-family: "' + this.settings.fontOptions[i][0] + '"');
            li.innerHTML = this.settings.fontOptions[i][0];
            fontList.appendChild(li);
        }
        cb();
    };

    Josh.AC.prototype.wireEvents = function wireEvents() {
        start.addEventListener('click', function(){
            photoCountDown(This.settings.photoTime, 1);
            start.classList.toggle('hidden');
        });

        filters.addEventListener('change', function(){
            webcam.setFilter(This.settings.filters[filters.selectedIndex][0]);
        });

        greetings.addEventListener('change', function(){
            This.changeGreetingText(This.settings.fontChosen, This.settings.fontSizeChosen);
        });

        backgrounds.addEventListener('click', function(e){
            if (e.target.tagName === 'IMG') {
                drawBackground(e.target);
            }
        });

        window.addEventListener("hashchange", function(){
            This.loadNewSettings(location.hash.substring(1) + '.json');
        });
    };

    Josh.AC.prototype.setGreeting = function setGreeting(g){
        greetings.value = g;
        This.changeGreetingText(This.settings.fontChosen, This.settings.fontSizeChosen);
    };

    Josh.AC.prototype.cleanUp = function cleanUp() {
        backgrounds.innerHTML = null;
        photoCredits.innerHTML = null;
    };

    Josh.AC.prototype.loadNewSettings = function loadNewSettings(settingsName) {
        quickGetJSON(settingsName, function(d){
            This.settings = d;
            This.cleanUp();
            This.loadBackgrounds();
            This.setGreeting(This.settings.message);
        });
    };

})(window.Josh = window.Josh || {});