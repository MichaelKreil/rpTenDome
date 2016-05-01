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
			me.group = 4;
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
			p.camera = new THREE.CubeCamera(1, 3000, 1024);
			p.camera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;

			p.scene2 = new THREE.Scene();
			p.camera2 = new THREE.OrthographicCamera(-w/2, w/2, h/2, -h/2, 1, 3000);
			p.camera2.position.z = Math.min(w,h);
			p.scene2.add(p.camera2);

			var material = new THREE.MeshBasicMaterial({envMap:p.camera.renderTarget});
			//var material = new THREE.MeshNormalMaterial();

			var points = [];
			var n = 80;
			var s = Math.min(w,h)*0.84;
			for (var i = -0.999; i <= n*0.62; i++) {
				var x,y;
				y = i/n;
				if (i < 0) y = 0;
				x = -Math.log(Math.cos(y));
				points.push(new THREE.Vector2(y*s+1e-6, x*s))
			}

			var fisheyeReflector = new THREE.LatheGeometry(points, n*2);
			fisheyeReflector = new THREE.Mesh(fisheyeReflector, material);
			fisheyeReflector.rotation.x = -Math.PI/2;
			
			p.scene2.add(fisheyeReflector);
			p.camera.lookAt(new THREE.Vector3(0, 10, 0));
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



