function quickGetJSON(url, callback)
{
    var request = new XMLHttpRequest();
    request.onreadystatechange = function()
    {
        if (request.readyState == 4 && request.status == 200)
        {
            callback(JSON.parse(request.responseText));
        }
    }
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
};

(function(Josh){
    Josh.LayeredCanvas = function LayeredCanvas(finalCanvas){
        this.final = finalCanvas;
        this.layers = [];
        this.layerHash = {};
        this.ctx = final.getContext('2d');
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

        getImage: function() {
            var img = new Image();
            this.render();
            img.src = this.final.toDataURL();
            return img;
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
        cd;

    Josh.AC = function AC(){
        "use strict";
        This = this;
        this.getSettings();
    };

    Josh.AC.prototype.getSettings = function getSettings(){
        quickGetJSON("settings.json", function(d){
           This.settings = d;
           This.init();
        });
    };

    Josh.AC.prototype.init = function init(){
        //set everything up
        allow = document.getElementById('webcam-allow');
        canvas = document.getElementById('final');
        canvas_container = document.getElementById('canvas-container');
        ctx = canvas.getContext('2d');
        layered = new Josh.LayeredCanvas(canvas);
        base = new Josh.Layer(NewCanvas(1190, 850, "rgb(255,255,255)"), 0, 0);
        panel1 = new Josh.Layer(NewCanvas(540, 360, "rgb(0,0,0)"), 0, 0);
        panel2 = new Josh.Layer(NewCanvas(640, 360,"rgb(0,0,0)"), 550, 0);
        panel3 = new Josh.Layer(NewCanvas(640, 480, "rgb(0,0,0)"), 0, 370);
        backCanvas = new Josh.Layer(NewCanvas(540, 480,"rgb(0,0,0)"), 650, 370);
        textCanvas = document.createElement('canvas');
        countDown = document.createElement('canvas');
        start = document.getElementById('start');
        filters = document.getElementById('filters');
        fontList = document.getElementById(('fonts'));
        greetings = document.getElementById('greetings');
        backgrounds = document.getElementById(('backgrounds'));

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

        FullDraw = function FullDraw()
        {
            layered.render();
            requestAnimFrame(FullDraw);
        }

        drawBackground = function drawBackground(img) {
            var ratio = img.width / backCanvas.width;
            backCanvas.ctx.drawImage(img, 0, 0, img.width / ratio, img.height / ratio) ;
            backCanvas.renderOnce = true;
        };

        requestAnimFrame(FullDraw);

        webcam = wcvj.webcam('a', {glfx: true});
        webcam.video.addEventListener('canplay', function(e){
            start.classList.toggle('hidden');
            allow.classList.add('hidden');
            cd.clearCanvas();
            
            function partial(ctx){
                ctx.drawImage(webcam.canvas, 50, 50, 540, 360, 0,0, 540, 360);
            };

            function full(ctx){
                ctx.drawImage(webcam.canvas, 0, 0);
            }

            panel1.draw = partial;
            panel2.draw = full;
            panel3.draw = full;

        });

        this.loadFilters();
    };

    Josh.AC.prototype.loadFilters = function loadFilters() {
        for(var i=0; i<this.settings.filters.length; i++) {
            filters.options[filters.options.length] = new Option(this.settings.filters[i][1], i);
        }
    };

})(window.Josh = window.Josh || {});