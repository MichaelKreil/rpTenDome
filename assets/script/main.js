var projector = new Projector('cubemapdebug');
projector.setMaxDuration(10);

var spheres = [];

projector.initScene(function (scene) {
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
	scene.add(sky);

	var geometry = new THREE.IcosahedronGeometry(30, 3);

	this.group = new THREE.Group();

	for (var i = 0; i < 100; i++) {
		var material = new THREE.MeshStandardMaterial( {
			color: Math.floor(Math.random()*0xffffff),
			roughness: 0.3,
			metalness: 0
		});
		var sphere = new THREE.Mesh(geometry, material);
		sphere.matrixAutoUpdate = false;

		this.group.add(sphere);
		spheres.push(sphere);
	}

	spheres.forEach(function (sphere) {
		var r = Math.random()*300+300;
		var a = Math.random()*Math.PI*2;
		var y = Math.random()*200+30;
		var cx = (Math.random()-0.5)*200;
		var cz = (Math.random()-0.5)*200;
		var speed = Math.random()*0.03+0.03;

		sphere.updatePosition = function (time) {
			sphere.position.x = cx + Math.cos(a + time*speed)*r;
			sphere.position.y = y;
			sphere.position.z = cz + Math.sin(a + time*speed)*r;
			sphere.updateMatrix();
		}
	})

	scene.add(this.group);
})

projector.animate(function (scene) {
	var time = Date.now()/1000;

	spheres.forEach(function (sphere) {
		sphere.updatePosition(time);
	})
})

window.addEventListener('load', projector.start);
