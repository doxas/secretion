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
 * 9    : position buffer
 * 10   : position swap buffer
 * 11   : velocity buffer
 * 12   : velocity swap buffer
 */

/* shaders
 * scenePrg    : base scene program
 * finalPrg    : final scene program
 * noisePrg    : noise program
 * gaussPrg    : gauss blur program
 * resetPrg    : gpgpu reset program
 * positionPrg : gpgpu position update program
 * velocityPrg : gpgpu velocity update program
 * gradationPrg: background gradation program
 * vignettePrg : post vignette program
 * fadeoutPrg  : post fadeout program
 */

(function(){
    'use strict';

    // variable ===============================================================
    var canvas, gl, ext, run, mat4, qtn;
    var scenePrg, noisePrg, gaussPrg, resetPrg, positionPrg, velocityPrg;
    var finalPrg, vignettePrg, fadeoutPrg;
    var gradationPrg;
    var canvasPoint, canvasGlow;
    var gWeight, nowTime;
    var canvasWidth, canvasHeight, bufferSize, gpgpuBufferSize;
    var pCanvas, pContext, pPower, pTarget, pCount, pListener;

    // variable initialize ====================================================
    run = true;
    mat4 = gl3.mat4;
    qtn = gl3.qtn;
    bufferSize = 1024;
    gpgpuBufferSize = 1024;

    // const variable =========================================================
    var DEFAULT_CAM_POSITION = [0.0, 0.0, 5.0];
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
            ['mvpMatrix', 'positionTexture', 'time'],
            ['matrix4fv', '1i', '1f'],
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

        // gpgpu reset program
        resetPrg = gl3.program.create_from_file(
            'shader/gpgpuReset.vert',
            'shader/gpgpuReset.frag',
            ['position', 'texCoord'],
            [3, 2],
            ['noiseTexture'],
            ['1i'],
            shaderLoadCheck
        );

        // gpgpu position program
        positionPrg = gl3.program.create_from_file(
            'shader/gpgpuPosition.vert',
            'shader/gpgpuPosition.frag',
            ['position', 'texCoord'],
            [3, 2],
            ['time', 'noiseTexture', 'previousTexture', 'velocityTexture'],
            ['1f', '1i', '1i', '1i'],
            shaderLoadCheck
        );

        // gpgpu velocity program
        velocityPrg = gl3.program.create_from_file(
            'shader/gpgpuVelocity.vert',
            'shader/gpgpuVelocity.frag',
            ['position', 'texCoord'],
            [3, 2],
            ['time', 'noiseTexture', 'previousTexture'],
            ['1f', '1i', '1i'],
            shaderLoadCheck
        );

        // gradation program
        gradationPrg = gl3.program.create_from_file(
            'shader/backgroundGradation.vert',
            'shader/backgroundGradation.frag',
            ['position'],
            [3],
            ['globalColor', 'texture', 'time', 'resolution'],
            ['4fv', '1i', '1f', '2fv'],
            shaderLoadCheck
        );

        // vignette program
        vignettePrg = gl3.program.create_from_file(
            'shader/postVignette.vert',
            'shader/postVignette.frag',
            ['position'],
            [3],
            ['globalColor', 'resolution'],
            ['4fv', '2fv'],
            shaderLoadCheck
        );

        // fadeout program
        fadeoutPrg = gl3.program.create_from_file(
            'shader/postFadeout.vert',
            'shader/postFadeout.frag',
            ['position'],
            [3],
            ['globalColor', 'resolution'],
            ['4fv', '2fv'],
            shaderLoadCheck
        );

        // final program
        finalPrg = gl3.program.create_from_file(
            'shader/final.vert',
            'shader/final.frag',
            ['position'],
            [3],
            ['globalColor', 'texture'],
            ['4fv', '1i'],
            shaderLoadCheck
        );

        function shaderLoadCheck(){
            if(scenePrg.prg != null &&
               noisePrg.prg != null &&
               gaussPrg.prg != null &&
               resetPrg.prg != null &&
               positionPrg.prg != null &&
               velocityPrg.prg != null &&
               gradationPrg.prg != null &&
               vignettePrg.prg != null &&
               fadeoutPrg.prg != null &&
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
        var tiledPlanePointData = tiledPlanePoint(gpgpuBufferSize);
        var tiledPlanePointVBO = [
            gl3.create_vbo(tiledPlanePointData.position),
            gl3.create_vbo(tiledPlanePointData.color),
            gl3.create_vbo(tiledPlanePointData.texCoord),
            gl3.create_vbo(tiledPlanePointData.type),
            gl3.create_vbo(tiledPlanePointData.random)
        ];
        var tiledPlaneHorizonLineIBO = gl3.create_ibo_int(tiledPlanePointData.indexHorizon);
        var tiledPlaneCrossLineIBO = gl3.create_ibo_int(tiledPlanePointData.indexCross);
        var tiledPlanePointLength = tiledPlanePointData.position.length / 3;

        // plane mesh
        var planePosition = [
            -1.0,  1.0,  0.0,
             1.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        var planeTexCoord = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
        var planeIndex = [
            0, 2, 1, 1, 2, 3
        ];
        var planeVBO = [gl3.create_vbo(planePosition)];
        var planeTexCoordVBO = [
            gl3.create_vbo(planePosition),
            gl3.create_vbo(planeTexCoord)
        ];
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
        var hGaussBuffer = gl3.create_framebuffer(canvasWidth / 2, canvasHeight / 2, 6);
        var vGaussBuffer = gl3.create_framebuffer(canvasWidth / 2, canvasHeight / 2, 7);
        var noiseBuffer = gl3.create_framebuffer(bufferSize, bufferSize, 8);
        var positionBuffer = [];
        positionBuffer[0] = gl3.create_framebuffer_float(gpgpuBufferSize, gpgpuBufferSize, 9);
        positionBuffer[1] = gl3.create_framebuffer_float(gpgpuBufferSize, gpgpuBufferSize, 10);
        var velocityBuffer = [];
        velocityBuffer[0] = gl3.create_framebuffer_float(gpgpuBufferSize, gpgpuBufferSize, 11);
        velocityBuffer[1] = gl3.create_framebuffer_float(gpgpuBufferSize, gpgpuBufferSize, 12);

        // texture setting
        (function(){
            var i;
            for(i = 0; i <= 12; ++i){
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

        // reset vertices
        gpgpuReset();

        // gl flags
        gl.disable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clearDepth(1.0);
        gl.disable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        // rendering
        var count = 0;
        var beginTime = Date.now();
        var targetBufferNum = 0;
        var cameraPosition = DEFAULT_CAM_POSITION;
        var centerPoint = DEFAULT_CAM_CENTER;
        var cameraUpDirection = DEFAULT_CAM_UP;
        // gl3.audio.src[0].play();
        render();

        function render(){
            var i;
            var soundData = [];
            nowTime = Date.now() - beginTime;
            nowTime /= 1000;
            count++;
            targetBufferNum = count % 2;

            // sound data
            gl3.audio.src[0].update = true;
            for(i = 0; i < 16; ++i){
                soundData[i] = gl3.audio.src[0].onData[i] / 255.0 + 0.1;
            }

            // animation
            if(run){requestAnimationFrame(render);}

            // canvas
            canvasWidth   = window.innerWidth;
            canvasHeight  = window.innerHeight;
            canvas.width  = canvasWidth;
            canvas.height = canvasHeight;

            // perspective projection and world
            var camera = gl3.camera.create(
                cameraPosition,
                centerPoint,
                cameraUpDirection,
                45, canvasWidth / canvasHeight, 0.1, 20.0
            );
            mat4.vpFromCamera(camera, vMatrix, pMatrix, vpMatrix);
            mat4.identity(mMatrix);
            mat4.rotate(mMatrix, Math.sin(nowTime / 4), [0.0, 0.0, 1.0], mMatrix);
            mat4.scale(mMatrix, [10.0, 10.0, 2.0], mMatrix);
            mat4.multiply(vpMatrix, mMatrix, mvpMatrix);

            // gpgpu update ---------------------------------------------------
            enableBlend(false);
            gpgpuUpdate();

            // render to frame buffer -----------------------------------------
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer.framebuffer);
            gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
            gl3.scene_view(camera, 0, 0, canvasWidth, canvasHeight);

            // plane point draw
            enableBlend(true);
            drawVertices();

            // gauss render to fBuffer ----------------------------------------
            gaussUpdate();

            // final scene ----------------------------------------------------
            enableBlend(true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl3.scene_clear([0.3, 0.0, 0.0, 1.0], 1.0);
            gl3.scene_view(null, 0, 0, canvasWidth, canvasHeight);

            // background gradation
            gradationPrg.set_program();
            gradationPrg.set_attribute(planeVBO, planeIBO);
            gradationPrg.push_shader([[1.0, 1.0, 1.0, 1.0], 8, nowTime, [canvasWidth, canvasHeight]]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);

            // plane point draw
            drawVertices();

            // post process
            gl.disable(gl.DEPTH_TEST);
            finalPrg.set_program();
            finalPrg.set_attribute(planeVBO, planeIBO);
            finalPrg.push_shader([[1.0, 1.0, 1.0, 1.0], 7]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
            enableBlendAlpha();
            vignettePrg.set_program();
            vignettePrg.set_attribute(planeVBO, planeIBO);
            vignettePrg.push_shader([[1.0, 1.0, 1.0, 1.0], [canvasWidth, canvasHeight]]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
            fadeoutPrg.set_program();
            fadeoutPrg.set_attribute(planeVBO, planeIBO);
            fadeoutPrg.push_shader([[0.0, 0.0, 0.0, 0.0], [canvasWidth, canvasHeight]]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
        }

        function gpgpuUpdate(){
            gl.bindFramebuffer(gl.FRAMEBUFFER, velocityBuffer[targetBufferNum].framebuffer);
            gl3.scene_view(null, 0, 0, gpgpuBufferSize, gpgpuBufferSize);
            velocityPrg.set_program();
            velocityPrg.set_attribute(planeTexCoordVBO, planeIBO);
            velocityPrg.push_shader([nowTime, 8, 11 + 1 - targetBufferNum]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
            gl.bindFramebuffer(gl.FRAMEBUFFER, positionBuffer[targetBufferNum].framebuffer);
            gl3.scene_view(null, 0, 0, gpgpuBufferSize, gpgpuBufferSize);
            positionPrg.set_program();
            positionPrg.set_attribute(planeTexCoordVBO, planeIBO);
            positionPrg.push_shader([nowTime, 8, 9 + 1 - targetBufferNum, 11 + targetBufferNum]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
        }

        function gpgpuReset(){
            var i, j;
            gl3.scene_view(null, 0, 0, gpgpuBufferSize, gpgpuBufferSize);
            resetPrg.set_program();
            resetPrg.set_attribute(planeTexCoordVBO, planeIBO);
            resetPrg.push_shader([8]);
            for(i = 0; i < 2; ++i){
                gl.bindFramebuffer(gl.FRAMEBUFFER, positionBuffer[i].framebuffer);
                gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
                gl.bindFramebuffer(gl.FRAMEBUFFER, velocityBuffer[i].framebuffer);
                gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
            }
        }

        function drawVertices(){
            scenePrg.set_program();
            scenePrg.set_attribute(tiledPlanePointVBO, tiledPlaneCrossLineIBO);
            scenePrg.push_shader([mvpMatrix, 9 + targetBufferNum, 1, 0, nowTime]);
            gl3.draw_arrays(gl.POINTS, tiledPlanePointLength);
            gl3.draw_elements_int(gl.LINES, tiledPlanePointData.indexCross.length);
        }

        function gaussUpdate(){
            var w = canvasWidth / 2;
            var h = canvasHeight / 2;
            gaussPrg.set_program();
            gaussPrg.set_attribute(planeVBO, planeIBO);
            gl.bindFramebuffer(gl.FRAMEBUFFER, hGaussBuffer.framebuffer);
            gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
            gl3.scene_view(null, 0, 0, w, h);
            gaussPrg.push_shader([[w, h], true, gWeight, 5]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);
            gl.bindFramebuffer(gl.FRAMEBUFFER, vGaussBuffer.framebuffer);
            gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
            gl3.scene_view(null, 0, 0, w, h);
            gaussPrg.push_shader([[w, h], false, gWeight, 6]);
            gl3.draw_elements_int(gl.TRIANGLES, planeIndex.length);

        }

        function enableBlend(flg){
            if(flg){
                gl.enable(gl.BLEND);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
                // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
            }else{
                gl.disable(gl.BLEND);
            }
        }

        function enableBlendAlpha(){
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
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
        // c.style.position = 'absolute';
        // c.style.bottom = '0px';
        // c.style.left = '0px';
        // document.body.appendChild(c);
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
        // c.style.position = 'absolute';
        // c.style.bottom = '0px';
        // c.style.right = '0px';
        // document.body.appendChild(c);
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

