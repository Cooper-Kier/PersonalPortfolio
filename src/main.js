import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { showPopup } from './popup.js'; 

class Scene3D {
  constructor(containerId) {
    //Scene 
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();

    //Objects
    this.highlightableObjects = new Map();
    this.outlineMeshes = new Map();
    this.originalScales = new Map();
    this.hoveredObject = null;

    this.externalLinks = new Map([
      ['Github', 'https://github.com/Cooper-Kier'],
      ['LinkedIn', 'https://www.linkedin.com/in/cooper-kier-b2bb112a0/']  // Replace with your LinkedIn username
    ]);

    this.objectToPopupMap = new Map([
      ['Books', 'about'],
      ['Flag', 'about'],
      ['PC_Screen', 'projects'],
      ['Case', 'experience'],
      ['Football', 'extracurricular'],
      ['Phone', 'contact']
    ]);

    //Mouse
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line.threshold = 0.1;
    this.raycaster.params.Points.threshold = 0.1;

    //Initiallers
    this.initRenderer();
    this.initCamera();
    this.initControls();
    this.initLights();
    this.initEventListeners();
    this.loadModel();

    this.animate();
  }


  //Initializers
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.5;
    
    this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    this.camera.position.set(2, 1.5, 2);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.maxAzimuthAngle = Math.PI/2;
    this.controls.minAzimuthAngle = 0;
    this.controls.maxPolarAngle = Math.PI/3;
    this.controls.minPolarAngle = Math.PI/4;

    this.controls.enablePan = false;
    
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    this.controls.rotateSpeed = 0.5;
  }

  initLights() {
    // Key light (warm directional light)
    const keyLight = new THREE.DirectionalLight(0xff9933, 3);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    this.setupShadowCamera(keyLight);
    this.scene.add(keyLight);

    // Cool blue rim light
    const rimLight = new THREE.SpotLight(0x0066ff, 4);
    rimLight.position.set(-3, 2, -3);
    rimLight.angle = Math.PI / 4;
    rimLight.penumbra = 0.5;
    rimLight.decay = 1.5;
    rimLight.distance = 20;
    this.scene.add(rimLight);

    // Purple fill light
    const fillLight = new THREE.PointLight(0xffffff, 2, 10);
    fillLight.position.set(-2, 1, 2);
    this.scene.add(fillLight);

    // Cyan accent light
    const accentLight = new THREE.PointLight(0x00ffff, 2, 8);
    accentLight.position.set(2, 0.5, -2);
    this.scene.add(accentLight);

    // White overhead light
    const whiteLight = new THREE.PointLight(0x000000, 2, 8);
    whiteLight.position.set(0, 5, 0);
    this.scene.add(whiteLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x222222, 2);
    this.scene.add(ambientLight);
  }

  setupShadowCamera(light) {
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
  }

  initEventListeners() {
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  loadModel() {
    const loader = new GLTFLoader();
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide
    });

    // Add loading manager to debug issues
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onError = function(url) {
        console.error('Error loading:', url);
    };

    // Use absolute path and add error handling
    loader.setPath('/models/');
    loader
        .load(
            'Room.glb',
            (gltf) => {
                const object = gltf.scene;
                this.processSceneObjects(object, outlineMaterial);
                this.scene.add(object);
            },
            // Progress callback
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // Error callback
            (error) => {
                console.error('An error occurred loading the model:', error);
            }
        );
  }

  //Group meshes to object
  processSceneObjects(object, outlineMaterial) {
    object.traverse((child) => {
        if (child.name === 'Football' ||
            child.name === 'Case' ||
            child.name === 'PC_Screen' ||
            child.name === 'Books' ||
            child.name === 'Phone' ||
            child.name === 'Flag' ||
            child.name === 'Github' ||
            child.name === 'LinkedIn'){
            if (child.isMesh) {
                child.castShadow = true;
                
                if (child.name) {
                    this.highlightableObjects.set(child.name, child);
                    this.createOutlineMesh(child, outlineMaterial);
                    this.originalScales.set(child.uuid, child.scale.clone());
                }
            } else if (child.isGroup && child.name) {
                this.highlightableObjects.set(child.name, child);
                
                child.traverse((groupChild) => {
                    if (groupChild.isMesh) {
                        this.createOutlineMesh(groupChild, outlineMaterial);
                        this.originalScales.set(groupChild.uuid, groupChild.scale.clone());
                    }
                });
            }
        }
        if (child.name === 'Football') {
          this.football = child;
        } else if (child.name === 'Case') {
          this.case = child;
        } else if (child.name === 'PC_Screen') {
          this.pc = child;
        } else if (child.name === 'Books') {
          this.book = child;
        } else if (child.name === 'Phone') {
          this.phone = child;
        } else if (child.name === 'Github') {
          this.git = child;
        } else if (child.name === 'LinkedIn') {
          this.linked = child;
        } else if (child.name === 'Flag') {
          this.flag = child;
        }
    });
  }

  //Highlighting object methods
  clearAllHighlights() {
    this.outlineMeshes.forEach(({mesh, originalObject}) => {
        mesh.visible = false;
        const originalScale = this.originalScales.get(originalObject.uuid);
        if (originalScale) {
            originalObject.scale.copy(originalScale);
        }
    });
  }
  
  createOutlineMesh(object) {
    const outlineGeometry = object.geometry.clone();
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.1
    });
    
    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    this.scene.add(outlineMesh);
    
    outlineMesh.matrixAutoUpdate = true;
    
    object.updateWorldMatrix(true, false);
    outlineMesh.position.setFromMatrixPosition(object.matrixWorld);
    outlineMesh.quaternion.setFromRotationMatrix(object.matrixWorld);
    outlineMesh.scale.setFromMatrixScale(object.matrixWorld).multiplyScalar(1);
    
    outlineMesh.visible = false;
    
    this.outlineMeshes.set(object.uuid, {
        mesh: outlineMesh,
        originalObject: object
    });
  }

  updateOutlineMesh(originalMesh, outlineMesh) {
    originalMesh.updateWorldMatrix(true, false);
    outlineMesh.position.setFromMatrixPosition(originalMesh.matrixWorld);
    outlineMesh.quaternion.setFromRotationMatrix(originalMesh.matrixWorld);
    outlineMesh.scale.setFromMatrixScale(originalMesh.matrixWorld).multiplyScalar(1);
  }
  
  //User event handling
  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onClick = (event) => {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshesToTest = Array.from(this.highlightableObjects.values()).reduce((acc, object) => {
      if (object.isGroup) {
        object.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentObject = object;
            acc.push(child);
          }
        });
      } else if (object.isMesh) {
        acc.push(object);
      }
      return acc;
    }, []);

    const intersects = this.raycaster.intersectObjects(meshesToTest, false);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const targetObject = intersectedObject.userData.parentObject || intersectedObject;
      
      console.log(`Clicked: ${targetObject.name}`);
      
      const externalLink = this.externalLinks.get(targetObject.name);
      if (externalLink) {
        window.open(externalLink, '_blank', 'noopener,noreferrer');
        return;
      }
      
      const popupId = this.objectToPopupMap.get(targetObject.name);
      if (popupId) {
        showPopup(popupId);
      }
    }
  }

  onMouseMove = (event) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.mouse.x = (x / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(y / this.renderer.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = Array.from(this.highlightableObjects.values()).reduce((acc, object) => {
      if (object.isGroup) {
        object.traverse((child) => {
          if (child.isMesh) {
            child.userData.parentGroup = object;
            acc.push(child);
          }
        });
      } else if (object.isMesh) {
        acc.push(object);
      }
      return acc;
    }, []);

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const parentGroup = intersectedObject.userData.parentGroup;
      const objectToHighlight = parentGroup || intersectedObject;
      
      if (this.hoveredObject !== objectToHighlight) {
        console.log(`Hovering: ${objectToHighlight.name}`);
        this.container.style.cursor = 'pointer';
        this.clearAllHighlights();
        this.hoveredObject = objectToHighlight;
        
        if (objectToHighlight.isGroup) {
          objectToHighlight.traverse((child) => {
            if (child.isMesh) {
              const outlineData = this.outlineMeshes.get(child.uuid);
              if (outlineData) {
                outlineData.mesh.visible = true;
                this.updateOutlineMesh(child, outlineData.mesh);
              }
            }
          });
        } else {
          const outlineData = this.outlineMeshes.get(objectToHighlight.uuid);
          if (outlineData) {
            outlineData.mesh.visible = true;
            this.updateOutlineMesh(objectToHighlight, outlineData.mesh);
          }
        }
      }
    } else {
      if (this.hoveredObject) {
        this.container.style.cursor = 'default';
        this.clearAllHighlights();
        this.hoveredObject = null;
      }
    }
  }
  

  
  animate = () => {
      requestAnimationFrame(this.animate);

      this.outlineMeshes.forEach(({mesh, originalObject}) => {
          if (mesh.visible) {
              originalObject.updateWorldMatrix(true, false);
              mesh.position.setFromMatrixPosition(originalObject.matrixWorld);
              mesh.quaternion.setFromRotationMatrix(originalObject.matrixWorld);
              mesh.scale.setFromMatrixScale(originalObject.matrixWorld).multiplyScalar(1.05);
          }
      });
      
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
  }

}

// Initialize the scene
const scene = new Scene3D('container3D');