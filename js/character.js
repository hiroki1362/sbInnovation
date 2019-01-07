let mesh, camera, scene, renderer;
let canvasWidth = 640;
let canvasHeight = 430;

$(function() {
	initCharacter();
	renderCharacter();
});

//シーン初期化処理
function initCharacter() {
	//シーン作成
	scene = new THREE.Scene();
	//アンビエント光
	let light = new THREE.DirectionalLight(0xeeeeee);
	scene.add(light);

	//画面表示
	renderer = new THREE.WebGLRenderer({
		alpha: true,
		canvas: document.querySelector("#characterCanvas")
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(0x000000, 0.5);

	//カメラ
	camera = new THREE.PerspectiveCamera(40, canvasWidth / canvasHeight, 1, 1000);
	//camera.position.set(0, 5, 22);
	camera.position.set(0, 10.5, 17.5);
	camera.rotation.x = -0.3;


	let loader = new THREE.MMDLoader();
	let modelFile = "./img/cocon/cocon_v101.pmx";

	let onProgress = function(xhr) {
		console.log("onProgress: " + xhr);
	}
	
	let onError = function(xhr) {
		console.log("error: " + xhr);
	}

	loader.load(
		modelFile,
		function(object) {
			mesh = object;
			mesh.position.set(0, -1.5, 0);
			mesh.rotation.set(0, 0, 0);
			scene.add(mesh);
		},
		onProgress,
		onError
	);
}

//レンダリング
function renderCharacter() {
	requestAnimationFrame(renderCharacter);
	renderer.clear();
	renderer.render(scene, camera);
}