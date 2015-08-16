// - webgl template -----------------------------------------------------------
//
//
//
// ----------------------------------------------------------------------------

(function(){
	'use strict';

	// variable ===============================================================
	var canvas, gl, run, mat4, qtn, mqt;
	var canvasWidth, canvasHeight;

	// initialize =============================================================
	run = true;
	mat4 = gl3.mat4;
	qtn = gl3.qtn;
	mqt = qtn.create();
	qtn.identity(mqt);

	window.onload = function(){
		gl3.initGL('canvas');
		if(!gl3.ready){console.log('initialize error'); return;}
		canvas = gl3.canvas;
		gl = gl3.gl;
		canvasWidth   = window.innerWidth;
		canvasHeight  = window.innerHeight;
		canvas.width  = canvasWidth;
		canvas.height = canvasHeight;

		// event
		canvas.addEventListener('mousemove', mouseMove, true);
		window.addEventListener('keydown', function(eve){run = (eve.keyCode !== 27);}, true);

		// program
		var prg = gl3.program.create(
			'vs',
			'fs',
			['position', 'texCoord'],
			[3, 2],
			['orthoMatrix', 'texture', 'resolution', 'hWeight', 'vWeight'],
			['matrix4fv', '1i', '2fv', '1fv', '1fv']
		);

		// gauss program
		var gPrg = gl3.program.create(
			'vs',
			'gauss_fs',
			['position', 'texCoord'],
			[3, 2],
			['orthoMatrix', 'texture', 'addTexture', 'resolution', 'weight', 'horizontal', 'additional'],
			['matrix4fv', '1i', '1i', '2fv', '1fv', '1i', '1i']
		);

		// lighting program
		var lPrg = gl3.program.create(
			'light_vs',
			'light_fs',
			['position', 'normal', 'color'],
			[3, 3, 4],
			['mMatrix', 'mvpMatrix', 'invMatrix', 'lightDirection', 'eyePosition', 'centerPoint', 'ambient'],
			['matrix4fv', 'matrix4fv', 'matrix4fv', '3fv', '3fv', '3fv', '4fv']
		);

		// torus mesh
		var torusData = gl3.mesh.torus(64, 64, 0.1, 0.25, [1.0, 1.0, 1.0, 1.0]);
		var torusVBO = [
			gl3.create_vbo(torusData.position),
			gl3.create_vbo(torusData.normal),
			gl3.create_vbo(torusData.color)
		];
		var torusIBO = gl3.create_ibo(torusData.index);

		// ortho plane mesh
		var planeData = gl3.mesh.plane(2.0, 2.0);
		var orthoVBO = [
			gl3.create_vbo(planeData.position),
			gl3.create_vbo(planeData.texCoord)
		];
		var orthoIBO = gl3.create_ibo(planeData.index);

		// matrix
		var mMatrix = mat4.identity(mat4.create());
		var vMatrix = mat4.identity(mat4.create());
		var pMatrix = mat4.identity(mat4.create());
		var vpMatrix = mat4.identity(mat4.create());
		var mvpMatrix = mat4.identity(mat4.create());
		var invMatrix = mat4.identity(mat4.create());
		var orthoMatrix = mat4.identity(mat4.create());

		// ortho projection
		var oCameraPosition = [0.0, 0.0, 0.5];
		var oCenterPoint = [0.0, 0.0, 0.0];
		var oCameraUpDirection = [0.0, 1.0, 0.0];
		mat4.lookAt(oCameraPosition, oCenterPoint, oCameraUpDirection, vMatrix);
		mat4.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1.0, pMatrix);
		mat4.multiply(pMatrix, vMatrix, orthoMatrix);

		// depth test
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clearDepth(1.0);

		// frame buffer
		var bufferSize = 512;
		var fBuffer = gl3.create_framebuffer(bufferSize, bufferSize, 0);
		var gaussBuffer1 = gl3.create_framebuffer(bufferSize, bufferSize, 1);
		var gaussBuffer2 = gl3.create_framebuffer(bufferSize, bufferSize, 2);

		// kernel
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

		// weight
		var weight = new Array(10);
		var t = 0.0;
		var d = 100.0;
		var i, j;
		for(i = 0; i < weight.length; i++){
			var r = 1.0 + 2.0 * i;
			var w = Math.exp(-0.5 * (r * r) / d);
			weight[i] = w;
			if(i > 0){w *= 2.0;}
			t += w;
		}
		for(j = 0; j < weight.length; j++){
			weight[j] /= t;
		}

		// rendering
		var count = 0;
		var lightDirection = [1.0, 1.0, 1.0];
		render();

		function render(){
			var i, j;
			count++;

			canvasWidth   = window.innerWidth;
			canvasHeight  = window.innerHeight;
			canvas.width  = canvasWidth;
			canvas.height = canvasHeight;

			// perspective projection
			var cameraPosition = [];
			var centerPoint = [0.0, 0.0, 0.0];
			var cameraUpDirection = [];
			qtn.toVecIII([0.0, 0.0, 5.0], mqt, cameraPosition);
			qtn.toVecIII([0.0, 1.0, 0.0], mqt, cameraUpDirection);
			var camera = gl3.camera.create(
				cameraPosition,
				centerPoint,
				cameraUpDirection,
				45, canvasWidth / canvasHeight, 0.1, 10.0
			);
			mat4.vpFromCamera(camera, vMatrix, pMatrix, vpMatrix);

			// torus
			lPrg.set_program();
			lPrg.set_attribute(torusVBO, torusIBO);

			// render to frame buffer
			gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.framebuffer);
			var clearColor = gl3.util.hsva(count % 360, 0.7, 0.5, 1.0);
			gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
			gl3.scene_view(camera, 0, 0, bufferSize, bufferSize);

			// off screen
			var radian = gl3.TRI.rad[count % 360];
			var axis = [0.0, 1.0, 1.0];
			for(i = 0; i < 8; i++){
				var s = gl3.TRI.sin[i * 45];
				var c = gl3.TRI.cos[i * 45];
				var offset = [c, s, 0.0];
				var ambient = gl3.util.hsva(i * 45, 1.0, 1.0, 1.0);
				mat4.identity(mMatrix);
				mat4.translate(mMatrix, offset, mMatrix);
				mat4.rotate(mMatrix, radian, axis, mMatrix);
				mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
				mat4.inverse(mMatrix, invMatrix);
				lPrg.push_shader([mMatrix, mvpMatrix, invMatrix, lightDirection, cameraPosition, centerPoint, ambient]);
				gl3.draw_elements(gl.TRIANGLES, torusData.index.length);
			}

			// texture setting
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, gl3.textures[0].texture);
			gl.activeTexture(gl.TEXTURE0);

			// ortho plane
			prg.set_attribute(orthoVBO, orthoIBO);

			// sobel render to gauss buffer
			prg.set_program();
			gl.bindTexture(gl.TEXTURE_2D, gl3.textures[0].texture);
			gl.bindFramebuffer(gl.FRAMEBUFFER, gaussBuffer1.framebuffer);
			gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
			gl3.scene_view(null, 0, 0, bufferSize, bufferSize);
			prg.push_shader([orthoMatrix, 0, [bufferSize, bufferSize], hWeight, vWeight]);
			gl3.draw_elements(gl.TRIANGLES, planeData.index.length);

			// horizon gauss render to fBuffer
			gPrg.set_program();
			gl.bindTexture(gl.TEXTURE_2D, gl3.textures[1].texture);
			gl.bindFramebuffer(gl.FRAMEBUFFER, gaussBuffer2.framebuffer);
			gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
			gl3.scene_view(null, 0, 0, bufferSize, bufferSize);
			gPrg.push_shader([orthoMatrix, 0, 1, [bufferSize, bufferSize], weight, true, false]);
			gl3.draw_elements(gl.TRIANGLES, planeData.index.length);

			// vertical gauss
			gl.bindTexture(gl.TEXTURE_2D, gl3.textures[2].texture);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl3.scene_clear([0.0, 0.0, 0.0, 1.0], 1.0);
			gl3.scene_view(null, 0, 0, gl3.canvas.width, gl3.canvas.height);
			gPrg.push_shader([orthoMatrix, 0, 1, [gl3.canvas.width, gl3.canvas.height], weight, false, true]);
			gl3.draw_elements(gl.TRIANGLES, planeData.index.length);

			if(run){requestAnimationFrame(render);}
		}
	};

	function mouseMove(eve) {
		var cw = canvasWidth;
		var ch = canvasHeight;
		var wh = 1 / Math.sqrt(cw * cw + ch * ch);
		var x = eve.clientX - canvas.offsetLeft - cw * 0.5;
		var y = eve.clientY - canvas.offsetTop - ch * 0.5;
		var sq = Math.sqrt(x * x + y * y);
		var r = sq * 2.0 * Math.PI * wh;
		if (sq != 1) {
			sq = 1 / sq;
			x *= sq;
			y *= sq;
		}
		qtn.rotate(r, [y, x, 0.0], mqt);
	}
})(this);

