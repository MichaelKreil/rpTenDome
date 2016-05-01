function Projector(type) {
	function BasicProjector() {
		var me = this;
		
		me.start = function () {
			me.stats = new Stats();
			me.stats.showPanel(0);
			document.body.appendChild(me.stats.dom);

			me.container = false;
			me.camera = false;
			me.scene = new THREE.Scene();
			me.renderer = false;

			me.startTime = Date.now();

			me.initContainer();
			me.initCamera();

			me.initScene(me.scene);
			me.initRenderer();

			me.drawFrame();
		}

		me.initContainer = function () {
			me.container = document.createElement('div');
			document.body.appendChild(me.container);
		}

		me.initCamera = function () {
			me.camera = new THREE.PerspectiveCamera(150, window.innerWidth/window.innerHeight, 1, 3000);
			me.camera.lookAt(new THREE.Vector3(0, 10, 0));
			me.scene.add(me.camera);
		}

		me.initRenderer = function () {
			me.renderer = new THREE.WebGLRenderer({antialias:true});
			me.renderer.setClearColor(0xffffff);
			me.renderer.setPixelRatio(window.devicePixelRatio);
			me.renderer.setSize(window.innerWidth, window.innerHeight);
			me.renderer.sortObjects = false;

			me.container.appendChild(me.renderer.domElement);
		}
		
		me.render = function () {
			me.renderer.render(me.scene, me.camera);
		}

		me.drawFrame = function () {
			me.stats.begin();
			if (me.animate) me.animate();
			me.render();
			me.stats.end();

			if (Date.now() < me.startTime+10000) requestAnimationFrame(me.drawFrame);
			//requestAnimationFrame(me.drawFrame);
		}

		return me;
	}

	var projector = new BasicProjector();

	switch (type.toLowerCase()) {
		case 'cubemap': CubeMapProjector(projector); break;
		case 'vertexshader': VertexShaderProjector(projector); break;
	}

	var me = this;
	me.initScene = function (cb) { projector.initScene = cb };
	me.start = function () { projector.start() };
	me.animate = function (cb) { projector.animate = cb };

	return me;

	function CubeMapProjector(p) {
		/*
			Verwendet eine CubeMap ... also 6 Cameras in alle Richtungen.
			Der damit gerenderte Buffer wird als Environment Map für eine "Kugel" verwendet.
			Die Kugel ist in Wirklichkeit eine Rotationsfläche mit der Funktion:
			y = arccos(exp(-x)) bzw. x = -ln(cos(y))
			Diese Rotationsfläche hat die Eigenschaft, dass der Normalenwinkel proportional
			zum Abstand von Zentrum ist. (Fischauge)
		*/
		p.initCamera = function () {
			var w = window.innerWidth;
			var h = window.innerHeight;
			var s = Math.min(w,h);
			p.camera = new THREE.CubeCamera(1, 3000, 1024);
			p.camera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
			p.camera.lookAt(new THREE.Vector3(0, 10, 0));

			p.scene2 = new THREE.Scene();
			p.camera2 = new THREE.OrthographicCamera(-w/2, w/2, h/2, -h/2, 1000000, 1001000);
			p.camera2.position.z = 1000001;
			p.camera2.lookAt(new THREE.Vector3(0, 0, 0))
			p.scene2.add(p.camera2);

			var material = new THREE.MeshBasicMaterial({envMap:p.camera.renderTarget});
			//var material = new THREE.MeshNormalMaterial({wireframe:true});

			var points = [];
			var n = 50;
			var size = s/2;
			for (var i = 0; i <= n; i++) {
				var y = (i-0.5)/(n-2);
				if (y < 0) y = 0;
				var x = -Math.log(Math.cos(y))/Math.tan(1);
				points.push(new THREE.Vector3(y*size+1e-10, x*size, 0))
			}

			var fisheyeReflector = new THREE.LatheGeometry(points, Math.round(n*Math.PI));
			fisheyeReflector = new THREE.Mesh(fisheyeReflector, material);
			fisheyeReflector.rotation.x = -Math.PI/2;
			fisheyeReflector.updateMatrix();
			
			p.scene2.add(fisheyeReflector);
		}
		var _initRenderer = p.initRenderer;
		p.initRenderer = function () {
			_initRenderer();
			p.renderer.setClearColor(0);
		}
		p.render = function () {
			p.camera.updateCubeMap(p.renderer, p.scene);
			p.renderer.render(p.scene2, p.camera2);
		}
	}

	function VertexShaderProjector(p) {
		/*
			ok, hier bin ich gescheitert :/
		*/
	}
}



