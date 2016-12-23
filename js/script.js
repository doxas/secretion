// - visionion ----------------------------------------------------------------
//
// visionion
//
// ----------------------------------------------------------------------------

/*global gl3*/

/* textures
 * 0 - 2: from canvas2d draw
 * 3 - 4: from image
 * 5    : draw target framebuffer
 * 6    : gauss horizon
 * 7    : gauss vertical
 * 8    : noise buffer
 *
 */

/* shaders
 * scenePrg: base scene program
 * finalPrg: final scene program
 * noisePrg: noise program
 * gaussPrg: gauss blur program
 *
 *
 *
 */

(function(){
    'use strict';

    // variable ===============================================================
    var canvas, gl, ext, run, mat4, qtn;
    var scenePrg, noisePrg, gaussPrg, finalPrg;
    var canvasPoint, canvasGlow;
    var gWeight, nowTime;
    var canvasWidth, canvasHeight;
    var pCanvas, pContext, pPower, pTarget, pCount, pListener;

    // variable initialize ====================================================
    run = true;
    mat4 = gl3.mat4;
    qtn = gl3.qtn;

    // const variable =========================================================
    var DEFAULT_CAM_POSITION = [0.0, 0.0, 3.0];
    var DEFAULT_CAM_CENTER   = [0.0, 0.0, 0.0];
    var DEFAULT_CAM_UP       = [0.0, 1.0, 0.0];

    // onload =================================================================
    window.addEventListener('load', function(){
        progressInit();

        // canvas draw
        canvasPoint = canvasDrawPoint();
        canvasGlow  = canvasDrawGlow();

        // gl3 initialize
        gl3.initGL('canvas');
        if(!gl3.ready){console.log('initialize error'); return;}
        canvas = gl3.canvas; gl = gl3.gl;
        canvas.width  = canvasWidth = window.innerWidth;
        canvas.height = canvasHeight = window.innerHeight;

        // extension
        ext = {};
        ext.elementIndexUint = gl.getExtension('OES_element_index_uint');
        ext.textureFloat = gl.getExtension('OES_texture_float');
        ext.drawBuffers = gl.getExtension('WEBGL_draw_buffers');

        // event
        window.addEventListener('keydown', function(eve){
            run = (eve.keyCode !== 27);
            console.log(nowTime);
            switch(eve.keyCode){
                case 13:
                    progressRender();
                    break;
                case 27:
                    gl3.audio.src[0].stop();
                    break;
                case 32:
                    gl3.audio.src[1].play();
                    break;
                default :
                    break;
            }
        }, true);

        // progress == 20%
        pTarget = 20;
        pCount = 0;
        setTimeout(function(){
            gl3.create_texture_canvas(canvasPoint, 0);
            gl3.create_texture_canvas(canvasGlow, 1);
            gl3.create_texture_canvas(canvasPoint, 2);
            gl3.create_texture('img/washi.jpg', 3, function(){
                gl3.create_texture('img/washi.jpg', 4, soundLoader);
            });
        }, 300);
    }, false);

    function soundLoader(){
        // progress == 40%
        pPower = pTarget;
        pTarget = 40;
        pCount = 0;
        setTimeout(function(){
            gl3.audio.init(0.5, 0.5);
            gl3.audio.load('snd/background.mp3', 0, true, true, soundLoadCheck);
            gl3.audio.load('snd/sound.mp3', 1, false, false, soundLoadCheck);

            function soundLoadCheck(){
                if(gl3.audio.loadComplete()){
                    // progress == 80%
                    pPower = pTarget;
                    pTarget = 80;
                    pCount = 0;
                    setTimeout(function(){
                        shaderLoader();
                    }, 300);
                }
            }
        }, 300);
    }

    function shaderLoader(){
        // programs
        scenePrg = gl3.program.create_from_file(
            'shader/planePoint.vert',
            'shader/planePoint.frag',
            ['position', 'color', 'texCoord', 'type', 'random'],
            [3, 4, 2, 4, 4],
            ['mvpMatrix', 'noiseTexture', 'bitmapTexture', 'pointTexture', 'time'],
            ['matrix4fv', '1i', '1i', '1i', '1f'],
            shaderLoadCheck
        );

        // noise program
        noisePrg = gl3.program.create_from_file(
            'shader/noise.vert',
            'shader/noise.frag',
            ['position'],
            [3],
            ['resolution'],
            ['2fv'],
            shaderLoadCheck
        );

        // gauss program
        gaussPrg = gl3.program.create_from_file(
            'shader/gaussian.vert',
            'shader/gaussian.frag',
            ['position'],
            [3],
            ['resolution', 'horizontal', 'weight', 'texture'],
            ['2fv', '1i', '1fv', '1i'],
            shaderLoadCheck
        );

        // final program
        finalPrg = gl3.program.create_from_file(
            'shader/final.vert',
            'shader/final.frag',
            ['position'],
            [3],
            ['globalColor', 'texture', 'time', 'resolution'],
            ['4fv', '1i', '1f', '2fv'],
            shaderLoadCheck
        );

        function shaderLoadCheck(){
            if(scenePrg.prg != null &&
               noisePrg.prg != null &&
               gaussPrg.prg != null &&
               finalPrg.prg != null &&
            true){
                // progress == 100%
                pPower = pTarget;
                pTarget = 100;
                pCount = 0;
            }
        }
    }

    function init(){
        // application setting
        canvasWidth   = window.innerWidth;
        canvasHeight  = window.innerHeight;
        canvas.width  = canvasWidth;
        canvas.height = canvasHeight;
        gWeight = gaussWeight(10, 100.0);
        var hWeight = [
             1.0,  0.0, -1.0,
             2.0,  0.0, -2.0,
             1.0,  0.0, -1.0
        ];
        var vWeight = [
             1.0,  2.0,  1.0,
             0.0,  0.0,  0.0,
            -1.0, -2.0, -1.0
        ];

        // tiled plane point mesh
        var tiledPlanePointData = tiledPlanePoint(16);
        var tiledPlanePointVBO = [
            gl3.create_vbo(tiledPlanePointData.position),
            gl3.create_vbo(tiledPlanePointData.color),
            gl3.create_vbo(tiledPlanePointData.texCoord),
            gl3.create_vbo(tiledPlanePointData.type),
            gl3.create_vbo(tiledPlanePointData.random)
        ];
        var tiledPlaneHorizonLineIBO = gl3.create_ibo_int(tiledPlanePointData.indexHorizon);
        var tiledPlaneCrossLineIBO = gl3.create_ibo_int(tiledPlanePointData.indexCross);

        // plane mesh
        var planePosition = [
            -1.0,  1.0,  0.0,
             1.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        var planeIndex = [
            0, 2, 1, 1, 2, 3
        ];
        var planeVBO = [gl3.create_vbo(planePosition)];
        var planeIBO = gl3.create_ibo_int(planeIndex);

        // matrix
        var mMatrix = mat4.identity(mat4.create());
        var vMatrix = mat4.identity(mat4.create());
        var pMatrix = mat4.identity(mat4.create());
        var vpMatrix = mat4.identity(mat4.create());
        var mvpMatrix = mat4.identity(mat4.create());
        var invMatrix = mat4.identity(mat4.create());

        // frame buffer
        var frameBuffer  = gl3.create_framebuffer(canvasWidth, canvasHeight, 5);
        var hGaussBuffer = gl3.create_framebuffer(canvasWidth, canvasHeight, 6);
        var vGaussBuffer = gl3.create_framebuffer(canvasWidth, canvasHeight, 7);
        var bufferSize = 1024;
        var noiseBuffer  = gl3.create_framebuffer(bufferSize, bufferSize, 8);

        // texture setting
        (function(){
            var i;
            for(i = 0; i < 9; ++i){
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, gl3.textures[i].texture);
            }
        })();

        // noise texture
        noisePrg.set_program();
        noisePrg.set_attribute(planeVBO, planeIBO);
        gl.bindFramebuffer(gl.FRAMEBUFFER, noiseBuffer.framebuffer);
        gl3.scene_clear([0.0, 0.0, 0.0, 1.0]);
        gl3.scene_view(null, 0, 0, bufferSize, bufferSize);
        noisePrg.push_shader([[bufferSize, bufferSize]]);
        gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);

        // gl flags
        gl.disable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clearDepth(1.0);
        gl.disable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE. gl.ONE);

        // rendering
        var count = 0;
        var beginTime = Date.now();
        // gl3.audio.src[0].play();
        render();

        function render(){
            var i;
            nowTime = Date.now() - beginTime;
            nowTime /= 1000;
            count++;

            // sound data
            gl3.audio.src[0].update = true;
            var soundData = [];
            for(i = 0; i < 16; ++i){
                soundData[i] = gl3.audio.src[0].onData[i] / 255.0 + 0.5;
            }

            // canvas
            canvasWidth   = window.innerWidth;
            canvasHeight  = window.innerHeight;
            canvas.width  = canvasWidth;
            canvas.height = canvasHeight;

            // perspective projection
            var cameraPosition    = DEFAULT_CAM_POSITION;
            var centerPoint       = DEFAULT_CAM_CENTER;
            var cameraUpDirection = DEFAULT_CAM_UP;
            var camera = gl3.camera.create(
                cameraPosition,
                centerPoint,
                cameraUpDirection,
                45, canvasWidth / canvasHeight, 0.1, 10.0
            );
            mat4.vpFromCamera(camera, vMatrix, pMatrix, vpMatrix);

            // render to frame buffer -----------------------------------------
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer.framebuffer);
            gl3.scene_clear([0.0, 0.0, 1.0, 1.0], 1.0);
            gl3.scene_view(camera, 0, 0, canvasWidth, canvasHeight);

            // temp plane point draw
            scenePrg.set_program();
            // scenePrg.set_attribute(tiledPlanePointVBO, null);
            scenePrg.set_attribute(tiledPlanePointVBO, tiledPlaneCrossLineIBO);
            mat4.identity(mMatrix);
            mat4.rotate(mMatrix, Math.sin(nowTime), [1, 1, 0], mMatrix);
            mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
            scenePrg.push_shader([mvpMatrix, 8, 2, 1, nowTime]);
            gl3.draw_arrays(gl.POINTS, tiledPlanePointData.position.length / 3);
            gl3.draw_elements_int(gl.LINES, tiledPlanePointData.indexCross.length);

            // horizon gauss render to fBuffer --------------------------------
            gaussPrg.set_program();
            gaussPrg.set_attribute(planeVBO, planeIBO);
            gl.bindFramebuffer(gl.FRAMEBUFFER, hGaussBuffer.framebuffer);
            gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
            gl3.scene_view(null, 0, 0, canvasWidth, canvasHeight);
            gaussPrg.push_shader([[canvasWidth, canvasHeight], true, gWeight, 5]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);

            // vertical gauss render to fBuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, vGaussBuffer.framebuffer);
            gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
            gl3.scene_view(null, 0, 0, canvasWidth, canvasHeight);
            gaussPrg.push_shader([[canvasWidth, canvasHeight], false, gWeight, 6]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);

            // final scene ----------------------------------------------------
            finalPrg.set_program();
            finalPrg.set_attribute(planeVBO, planeIBO);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
            gl3.scene_view(null, 0, 0, canvasWidth, canvasHeight);
            finalPrg.push_shader([[1.0, 1.0, 1.0, 1.0], 5, nowTime, [canvasWidth, canvasHeight]]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
            // finalPrg.push_shader([[1.0, 1.0, 1.0, 0.5], 7, nowTime, [canvasWidth, canvasHeight]]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);

            if(run){requestAnimationFrame(render);}
        }
    }

    function gaussWeight(resolution, power){
        var t = 0.0;
        var weight = [];
        for(var i = 0; i < resolution; i++){
            var r = 1.0 + 2.0 * i;
            var w = Math.exp(-0.5 * (r * r) / power);
            weight[i] = w;
            if(i > 0){w *= 2.0;}
            t += w;
        }
        for(i = 0; i < weight.length; i++){
            weight[i] /= t;
        }
        return weight;
    }

    function fullscreenRequest(){
        var b = document.body;
        if(b.requestFullscreen){
            b.requestFullscreen();
        }else if(b.webkitRequestFullscreen){
            b.webkitRequestFullscreen();
        }else if(b.mozRequestFullscreen){
            b.mozRequestFullscreen();
        }else if(b.msRequestFullscreen){
            b.msRequestFullscreen();
        }
    }

    function canvasDrawPoint(){
        var i, j, p, center;
        var c = document.createElement('canvas');
        var cx = c.getContext('2d');
        p = Math.PI * 2;
        c.width = c.height = 512;
        center = [c.width / 2, c.height / 2];
        cx.fillStyle = 'white';
        cx.strokeStyle = 'white';
        cx.shadowColor = 'white';
        cx.clearRect(0, 0, c.width, c.height);
        cx.shadowOffsetX = 512;
        cx.shadowOffsetY = 512;
        cx.beginPath();
        for(i = -1; i < 5; ++i){
            j = 20 - Math.pow(2, i);
            cx.shadowBlur = j;
            cx.arc(center[0] - 512, center[1] - 512, 200, 0, p);
            cx.stroke();
        }
        cx.closePath();
        cx.beginPath();
        cx.shadowOffsetX = 0;
        cx.shadowOffsetY = 0;
        for(i = -1; i < 6; ++i){
            j = 32 - Math.pow(2, i);
            cx.shadowBlur = j;
            cx.arc(center[0], center[1], 75, 0, p);
            cx.fill();
        }
        cx.shadowBlur = 0;
        cx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        cx.arc(center[0], center[1], 200, 0, p);
        cx.fill();
        cx.closePath();
        c.id = 'point';
        return c;
    }

    function canvasDrawGlow(){
        var i, j, center;
        var c = document.createElement('canvas');
        var cx = c.getContext('2d');
        c.width = c.height = 512;
        center = [c.width / 2, c.height / 2];
        cx.fillStyle = 'white';
        cx.shadowColor = 'white';
        cx.clearRect(0, 0, c.width, c.height);
        cx.beginPath();
        for(i = -1; i < 7; ++i){
            j = 100 - Math.pow(2, i);
            cx.shadowBlur = j;
            cx.arc(center[0], center[1], 150, 0, Math.PI * 2);
            cx.fill();
        }
        cx.closePath();
        c.id = 'glow';
        return c;
    }

    // progress ===============================================================
    function progressInit(){
        pPower = pTarget = pCount = 0;
        pListener = [];
        pCanvas = document.getElementById('progress');
        pCanvas.width = pCanvas.height = 100;
        pContext = pCanvas.getContext('2d');
        pContext.strokeStyle = 'white';
        progressUpdate();
    }

    function progressUpdate(){
        var i = gl3.util.easeOutCubic(Math.min(pCount / 10, 1.0));
        var j = (pPower + Math.floor((pTarget - pPower) * i)) / 100;
        var k = -Math.PI * 0.5;
        pContext.clearRect(0, 0, 100, 100);
        pContext.beginPath();
        pContext.arc(50, 50, 30, k, k + j * 2.0 * Math.PI, false);
        pContext.stroke();
        pContext.closePath();
        if(pTarget !== pPower){pCount++;}
        if(pCount > 10 && pTarget === 100){
            var e = document.getElementById('start');
            e.textContent = 'ready';
            e.className = '';
            e.addEventListener('click', progressRender, false);
            return;
        }
        requestAnimationFrame(progressUpdate);
    }

    function progressRender(){
        var e = document.getElementById('start');
        if(e.className !== ''){return;}
        e.textContent = 'start';
        e.className = 'disabled';
        e = document.getElementById('layer');
        e.className = 'disabled';
        setTimeout(function(){
            var e = document.getElementById('layer');
            e.className = 'none';
            // fullscreenRequest();
            init();
        }, 2000);
    }
})(this);

