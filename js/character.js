let mesh, camera, scene, renderer, effect;
let characterMmd;
let loader;
let canvasWidth = 640;
let canvasHeight = 430;
let helper, ikHelper, physicsHelper;
let clock = new THREE.Clock();

const modelFile = "./img/cocon/cocon_v101.pmx";

const motionFile = [
	"./img/motion/initStand_temp.vmd",
	"./img/motion/initStand_temp2.vmd",
	"./img/motion/anger1.vmd",
	"./img/motion/anger2.vmd",
	"./img/motion/apologize2.vmd",
	"./img/motion/disappointed2.vmd",
	"./img/motion/gossip1.vmd",
	"./img/motion/gossip2.vmd",
	"./img/motion/happy1.vmd",
	"./img/motion/happy2.vmd",
	"./img/motion/negotiate1.vmd",
	"./img/motion/negotiate2.vmd",
	"./img/motion/praise1.vmd",
	"./img/motion/praise2.vmd",
	"./img/motion/secret1.vmd",
	"./img/motion/secret2.vmd"
];

$(function() {
	initCharacter();
	animateCharacter();
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
		canvas: document.querySelector("#characterCanvas"),
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(0x000000, 0.5);

	effect = new THREE.OutlineEffect(renderer);

	//カメラ
	camera = new THREE.PerspectiveCamera(40, canvasWidth / canvasHeight, 1, 1000);
	camera.position.set(0, 10.5, 18.5);
	//camera.rotation.x = 1.1;

	helper = new THREE.MMDAnimationHelper({
		afterglow: 2.0
	});

	loader = new THREE.MMDLoader();

	let onProgress = function(xhr) {
		console.log("onProgress: " + xhr);
	}
	
	let onError = function(xhr) {
		console.log("error: " + xhr);
	}

	loader.loadWithAnimation(
		modelFile,
		motionFile[0],
		function(mmd) {
			characterMmd = mmd;
			mesh = mmd.mesh;
			mesh.position.set(0, -8.5, 1);
			mesh.rotation.set(-0.2, 0, 0);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			
			helper.add(mesh, {
				animation: mmd.animation,
				physics: true
			});

			ikHelper = helper.objects.get(mesh).ikSolver.createHelper();
			ikHelper.visible = false;
			scene.add(ikHelper);

			physicsHelper = helper.objects.get(mesh).physics.createHelper();
			physicsHelper.visible = false;
			scene.add(physicsHelper);

			//helper.setAnimation(mesh);
			//helper.setPhysics(mesh);
			
			let controls = new THREE.OrbitControls(camera, renderer.domElement);
		}, onProgress, onError);
}

function changeAnimation() {
	let motionNum = Math.floor(Math.random() * motionFile.length);
	loader.loadAnimation(
		motionFile[motionNum],
		mesh,
		function(newAnim) {
			helper.remove(mesh);
			helper.add(mesh, {
				animation: newAnim,
				physics: true
			});
		});
}

//アニメーション
function animateCharacter() {
	requestAnimationFrame(animateCharacter);
	renderCharacter();
}
//レンダリング
function renderCharacter() {
	helper.update(clock.getDelta());
	effect.render(scene, camera);
}