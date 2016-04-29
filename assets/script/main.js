window.addEventListener('load', start);

function start() {
	var stats = new Stats();
	stats.showPanel(0);
	document.body.appendChild( stats.dom );

	var projector = getProjector('cubeMap');

	var container, camera, scene, group, renderer;
	var camera2, scene2;

	var startTime = Date.now();

	initContainer();
	projector.initCamera();
	initScene();
	initRenderer();

	animate();

	function initContainer() {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
	}

	function initScene() {
		scene = new THREE.Scene();
		scene.add(camera);

		// Fog
		scene.fog = new THREE.Fog( 0xffffff, 1, 10000 );
		scene.fog.color.setHSL( 0.6, 0, 1 );

		// Lights
		var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
		hemiLight.color.setHSL( 0.6, 1, 0.6 );
		hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
		hemiLight.position.set( 0, 2000, 0 );
		scene.add(hemiLight);

		var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
		dirLight.color.setHSL( 0.1, 1, 0.95 );
		dirLight.position.set( -1, 2, 0 );
		dirLight.position.multiplyScalar( 10000 );
		scene.add(dirLight);

		// Sky
		var vertexShaderSky = [
			'varying vec3 vWorldPosition;',
			'void main() {',
			'	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
			'	vWorldPosition = worldPosition.xyz;',
			'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'}'
		].join('');
		var fragmentShaderSky = [
			'uniform vec3 topColor;',
			'uniform vec3 bottomColor;',
			'uniform float offset;',
			'uniform float exponent;',
			'varying vec3 vWorldPosition;',
			'void main() {',
			'	float h = normalize( vWorldPosition + offset ).y;',
			'	gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );',
			'}'
		].join('');
		var uniforms = {
			topColor: 	 { type:'c', value: new THREE.Color( 0x0077ff ) },
			bottomColor: { type:'c', value: new THREE.Color( 0xffffff ) },
			offset:		 { type:'f', value: 33 },
			exponent:	 { type:'f', value: 0.6 }
		};
		uniforms.topColor.value.copy( hemiLight.color );
		scene.fog.color.copy( uniforms.bottomColor.value );

		var skyGeo = new THREE.SphereGeometry( 2000, 32, 15 );
		var skyMat = new THREE.ShaderMaterial({
			vertexShader: vertexShaderSky,
			fragmentShader: fragmentShaderSky,
			uniforms: uniforms,
			side: THREE.BackSide
		});
		var sky = new THREE.Mesh( skyGeo, skyMat );
		scene.add( sky );



		var geometry = new THREE.OctahedronGeometry(30, 3);

		group = new THREE.Group();

		for (var i = 0; i < 100; i++) {
			var material = new THREE.MeshPhongMaterial( {
				color: Math.floor(Math.random()*0xffffff),
				specular: 0xffffff
			});
			var mesh = new THREE.Mesh( geometry, material );
			var r = Math.random()*200+800;
			var a = Math.random()*Math.PI*2;
			var y = Math.random()*200+200;
			mesh.position.x = Math.cos(a)*r;
			mesh.position.y = y;
			mesh.position.z = Math.sin(a)*r;

			mesh.matrixAutoUpdate = false;
			mesh.updateMatrix();

			group.add(mesh);
		}

		scene.add(group);
	}

	function initRenderer() {
		renderer = new THREE.WebGLRenderer({antialias:true});
		renderer.setClearColor(0xffffff);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.sortObjects = false;

		container.appendChild(renderer.domElement);
	}

	function animate() {
		stats.begin();

		group.rotation.x = 0;
		group.rotation.y = Date.now() * 0.00003;
		group.rotation.z = 0;

		projector.render();

		stats.end();

		if (Date.now() < startTime+60000) requestAnimationFrame( animate );
	}

	function getProjector(name) {
		switch (name) {
			case 'normal':
				/*
					Normale perspektivsche Kamera mit 150° Öffnungswinkel
				*/
				return {
					initCamera: function () {
						camera = new THREE.PerspectiveCamera( 150, window.innerWidth/window.innerHeight, 1, 3000 );
						camera.lookAt(new THREE.Vector3( 0, 10, 0 ));
					},
					render: function () {
						renderer.render(scene, camera);
					}
				}
			case 'cubeMap':
				/*
					Verwendet eine CubeMap ... also 6 Cameras in alle Richtungen.
					Der damit gerenderte Buffer wird als Environment Map für eine "Kugel" verwendet.
					Die Kugel ist in Wirklichkeit eine Rotationsfläche mit der Funktion:
					y = arccos(exp(-x)) bzw. x = -ln(cos(y))
					Diese Rotationsfläche hat die Eigenschaft, dass der Normalenwinkel proportional
					zum Abstand von Zentrum ist. (Fischauge)
				*/
				return {
					initCamera: function () {
						var w = window.innerWidth;
						var h = window.innerHeight;
						camera = new THREE.CubeCamera( 1, 3000, 1024);
						camera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;

						scene2 = new THREE.Scene();
						camera2 = new THREE.OrthographicCamera( -w/2, w/2, h/2, -h/2, 1, 3000);
						camera2.position.z = Math.min(w,h);
						scene2.add(camera2);

						var material = new THREE.MeshBasicMaterial({envMap:camera.renderTarget});
						//var material = new THREE.MeshNormalMaterial();

						var points = [];
						var n = 80;
						var s = Math.min(w,h)*0.84;
						for (var i = -0.999; i <= n*0.6; i++) {
							var x,y;
							y = Math.PI/2*i/n;
							if (i < 0) y = 0;
							x = -Math.log(Math.cos(y));
							points.push(new THREE.Vector2(y*s+1e-6, x*s))
						}

						var sphere = new THREE.LatheGeometry(points, n*2);
						sphere = new THREE.Mesh(sphere, material);
						sphere.rotation.x = -Math.PI/2;
						
						scene2.add(sphere);
						camera.lookAt(new THREE.Vector3( 0, 10, 0 ));
					},
					render: function () {
						camera.updateCubeMap( renderer, scene );
						renderer.render(scene2, camera2);
					}
				}
			default: throw Error();
		}
	}
}
