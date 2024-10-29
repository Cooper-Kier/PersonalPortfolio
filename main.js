import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let object;
let controls;

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();
loader.load(
  `models/room/Room.glb`,
  function (gltf) {
    object = gltf.scene;
    object.receiveShadow = true;
    scene.add(object);
  },
  function (error) {
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true}); //Alpha: true allows for the transparent background
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);


//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

//Set how far the camera will be from the 3D model
camera.position.set (2,3, 2);

//Add lighting
// let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
// light.position.set(2, 2, 1);
// light.target.position.set(0, 0, 0);
// light.castShadow = true;
// light.shadow.bias = -0.001;
// light.shadow.mapSize.width = 2048;
// light.shadow.mapSize.height = 2048;
// light.shadow.camera.near = 0.1;S
// light.shadow.camera.far = 500.0;
// light.shadow.camera.near = 0.5;
// light.shadow.camera.far = 500.0;
// light.shadow.camera.left = 100;
// light.shadow.camera.right = -100;
// light.shadow.camera.top = 100;
// light.shadow.camera.bottom = -100;
// scene.add(light);

// let light = new THREE.AmbientLight(0xFFFFFF, 0.5);
// scene.add(light);

//Add area lighting
const spotLight = new THREE.SpotLight(0xFF9F69);
spotLight.position.set(1.0393, -0.29884, 0.9955);
scene.add( spotLight );

const rectLight = new THREE.RectAreaLight(0xFFDCC5, 10,  4, 4);
rectLight.position.set(0, 6, 0);
rectLight.lookAt( 0, 0, 0 );
scene.add(rectLight)

const rectLight2 = new THREE.RectAreaLight(0xFF7051, 10,  5, 5);
rectLight2.position.set(-6, 5, -6);
rectLight2.lookAt(0, 0, 0);
scene.add(rectLight2)

const rectLight3 = new THREE.RectAreaLight(0x9098C2, 10,  5, 5);
rectLight3.position.set(-6, 5, 6);
rectLight3.lookAt(0, 0, 0);
scene.add(rectLight3)

const rectLight4 = new THREE.RectAreaLight(0xFFB98C, 10,  5, 5);
rectLight4.position.set(6, 5, 6);
rectLight4.lookAt(0, 0, 0);
scene.add(rectLight3)

const rectLight5 = new THREE.RectAreaLight(0xFF9963, 10,  5, 5);
rectLight5.position.set(6, 5, -6);
rectLight5.lookAt(0, 0, 0);
scene.add(rectLight3)


//This adds controls to the camera, so we can rotate / zoom it with the mouse
controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.maxAzimuthAngle = Math.PI/2;
controls.minAzimuthAngle = 0;

controls.maxPolarAngle = Math.PI/3;
controls.minPolarAngle = Math.PI/4;


//Render the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

//Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//Start the 3D rendering
animate();