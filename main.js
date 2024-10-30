import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Create a Three.JS Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let object;
let controls;


// Instantiate a loader for the .gltf file
const loader = new GLTFLoader();
loader.load(
  `models/room/Room.glb`,
  function (gltf) {
    object = gltf.scene;
    // Enable shadows for the loaded model
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
    scene.add(object);
  },
  function (error) {
    console.error(error);
  }
);

const keyLight = new THREE.DirectionalLight(0xff9933, 3);
keyLight.position.set(5, 5, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
scene.add(keyLight);

// Cool blue rim light
const rimLight = new THREE.SpotLight(0x0066ff, 4);
rimLight.position.set(-3, 2, -3);
rimLight.angle = Math.PI / 4;
rimLight.penumbra = 0.5;
rimLight.decay = 1.5;
rimLight.distance = 20;
scene.add(rimLight);

// Purple fill light
const fillLight = new THREE.PointLight(0xff00ff, 2, 10);
fillLight.position.set(-2, 1, 2);
scene.add(fillLight);

// Cyan accent light
const accentLight = new THREE.PointLight(0x00ffff, 2, 8);
accentLight.position.set(2, 0.5, -2);
scene.add(accentLight);

const whiteLight = new THREE.PointLight(0x000000, 2, 8);
accentLight.position.set(0, 5, 0);
scene.add(accentLight);

// Very subtle ambient light
const ambientLight = new THREE.AmbientLight(0x222222, 2);
scene.add(ambientLight);

// Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Enable physically correct lighting
renderer.physicallyCorrectLights = true;
// Add tone mapping for better contrast
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5; // Significantly increased from 1.5 to 2.5

// Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

// Set how far the camera will be from the 3D model
camera.position.set(2, 1.5, 2);

// This adds controls to the camera
controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.maxAzimuthAngle = Math.PI/2;
controls.minAzimuthAngle = 0;
controls.maxPolarAngle = Math.PI/3;
controls.minPolarAngle = Math.PI/4;

// Render the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Add a listener to the window for resize
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the 3D rendering
animate();