import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

class Scene3D {
  constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.scene = new THREE.Scene();
      this.highlightableObjects = new Map();
      this.outlineMeshes = new Map();
      this.originalScales = new Map(); // Store original scales
      this.mouse = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycaster.params.Line.threshold = 0.1;
      this.raycaster.params.Points.threshold = 0.1;

      //Objects
      this.football = null;
      this.flag = null;
      this.case = null;
      this.pc = null;
      this.book = null;
      this.phone = null;
      
      this.initRenderer();
      this.initCamera();
      this.initControls();
      this.initLights();
      this.initEventListeners();
      this.loadModel();
      
      this.animate();
  }

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
      this.camera.position.set(2.2, 0, 2.2);
  }

  initControls() {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableZoom = false;
      this.controls.maxAzimuthAngle = Math.PI/2;
      this.controls.minAzimuthAngle = 0;
      this.controls.maxPolarAngle = Math.PI/3;
      this.controls.minPolarAngle = Math.PI/4;
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
      const fillLight = new THREE.PointLight(0xff00ff, 2, 10);
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

  loadModel() {
    const loader = new GLTFLoader();
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide
    });

    loader.load(
        'models/room/Room.glb',
        (gltf) => {
            const object = gltf.scene;
            this.processSceneObjects(object, outlineMaterial);
            this.scene.add(object);
        },
        undefined,
        (error) => console.error(error)
    );
  }

  processSceneObjects(object, outlineMaterial) {
    object.traverse((child) => {
        if (child.name === 'Football' ||
            child.name === 'Case' ||
            child.name === 'PC_Screen' ||
            child.name === 'Books' ||
            child.name === 'Phone' ){
            if (child.isMesh) {
                child.castShadow = true;
                
                if (child.name) {
                    this.highlightableObjects.set(child.name, child);
                    this.createOutlineMesh(child, outlineMaterial);
                    // Store original scale
                    this.originalScales.set(child.uuid, child.scale.clone());
                }
            } else if (child.isGroup && child.name) {
                this.highlightableObjects.set(child.name, child);
                
                child.traverse((groupChild) => {
                    if (groupChild.isMesh) {
                        this.createOutlineMesh(groupChild, outlineMaterial);
                        // Store original scale for group children
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
        }
    });
  }


  clearAllHighlights() {
    this.outlineMeshes.forEach(({mesh, originalObject}) => {
        mesh.visible = false;
        // Restore original scale
        const originalScale = this.originalScales.get(originalObject.uuid);
        if (originalScale) {
            originalObject.scale.copy(originalScale);
        }
    });
  }

  // Method to highlight a specific named object or group
  highlightObjectByName(name, highlightColor = 0xffffff) {
    const object = this.highlightableObjects.get(name);
    
    if (object) {
        this.clearAllHighlights();
        this.currentHighlightedObject = object;
        
        if (object.isGroup) {
            object.traverse((child) => {
                if (child.isMesh) {
                    const outlineData = this.outlineMeshes.get(child.uuid);
                    if (outlineData) {
                        outlineData.mesh.material.color.setHex(highlightColor);
                        outlineData.mesh.visible = true;
                        
                        // Scale up the original object
                        const originalScale = this.originalScales.get(child.uuid);
                        if (originalScale) {
                            child.scale.copy(originalScale).multiplyScalar(1.05);
                        }
                        
                        child.updateWorldMatrix(true, false);
                        outlineData.mesh.matrix.copy(child.matrixWorld);
                        outlineData.mesh.scale.set(1.05, 1.05, 1.05);
                    }
                }
            });
        } else {
            const outlineData = this.outlineMeshes.get(object.uuid);
            if (outlineData) {
                outlineData.mesh.material.color.setHex(highlightColor);
                outlineData.mesh.visible = true;
                
                // Scale up the original object
                const originalScale = this.originalScales.get(object.uuid);
                if (originalScale) {
                    object.scale.copy(originalScale).multiplyScalar(1.05);
                }
                
                object.updateWorldMatrix(true, false);
                outlineData.mesh.matrix.copy(object.matrixWorld);
                outlineData.mesh.scale.set(1.05, 1.05, 1.05);
            }
        }
    }
  }

  // Method to remove highlight from a named object or group
  removeHighlight(name) {
    const object = this.highlightableObjects.get(name);
    
    if (object) {
        if (object.isGroup) {
            object.traverse((child) => {
                if (child.isMesh) {
                    const outlineMesh = this.outlineMeshes.get(child.uuid);
                    if (outlineMesh) {
                        outlineMesh.visible = false;
                    }
                }
            });
        } else {
            const outlineMesh = this.outlineMeshes.get(object.uuid);
            if (outlineMesh) {
                outlineMesh.visible = false;
            }
        }
    }
  }

  onWindowResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initEventListeners() {
      document.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('resize', this.onWindowResize);
  }

  createOutlineMesh(object) {
    // Create a new geometry from the original
    const outlineGeometry = object.geometry.clone();
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.4
    });
    
    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    this.scene.add(outlineMesh);
    
    // Enable matrix updates
    outlineMesh.matrixAutoUpdate = true;
    
    // Set initial position, rotation, and scale
    object.updateWorldMatrix(true, false);
    outlineMesh.position.setFromMatrixPosition(object.matrixWorld);
    outlineMesh.quaternion.setFromRotationMatrix(object.matrixWorld);
    outlineMesh.scale.setFromMatrixScale(object.matrixWorld).multiplyScalar(1.05);
    
    outlineMesh.visible = false;
    
    // Store the outline mesh with reference to its original object
    this.outlineMeshes.set(object.uuid, {
        mesh: outlineMesh,
        originalObject: object
    });
  }

  onMouseMove = (event) => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshesToTest = [];
    this.highlightableObjects.forEach((object) => {
        if (object.isGroup) {
            object.traverse((child) => {
                if (child.isMesh) {
                    child.userData.parentGroup = object;
                    meshesToTest.push(child);
                }
            });
        } else if (object.isMesh) {
            meshesToTest.push(object);
        }
    });

    const intersects = this.raycaster.intersectObjects(meshesToTest, false);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const parentGroup = intersectedObject.userData.parentGroup;
        const objectToHighlight = parentGroup || intersectedObject;

        if (this.hoveredObject !== objectToHighlight) {
            this.clearAllHighlights();
            this.hoveredObject = objectToHighlight;

            if (objectToHighlight.isGroup) {
                objectToHighlight.traverse((child) => {
                    if (child.isMesh) {
                        const outlineData = this.outlineMeshes.get(child.uuid);
                        if (outlineData) {
                            outlineData.mesh.visible = true;
                            outlineData.mesh.material.color.setHex(0xffffff);
                            
                            // Scale up the original object
                            const originalScale = this.originalScales.get(child.uuid);
                            if (originalScale) {
                                child.scale.copy(originalScale).multiplyScalar(1.1);
                            }
                            
                            child.updateWorldMatrix(true, false);
                            outlineData.mesh.position.setFromMatrixPosition(child.matrixWorld);
                            outlineData.mesh.quaternion.setFromRotationMatrix(child.matrixWorld);
                            outlineData.mesh.scale.setFromMatrixScale(child.matrixWorld).multiplyScalar(1.05);
                        }
                    }
                });
            } else {
                const outlineData = this.outlineMeshes.get(objectToHighlight.uuid);
                if (outlineData) {
                    outlineData.mesh.visible = true;
                    outlineData.mesh.material.color.setHex(0xffffff);
                    
                    // Scale up the original object
                    const originalScale = this.originalScales.get(objectToHighlight.uuid);
                    if (originalScale) {
                        objectToHighlight.scale.copy(originalScale).multiplyScalar(1.05);
                    }
                    
                    objectToHighlight.updateWorldMatrix(true, false);
                    outlineData.mesh.position.setFromMatrixPosition(objectToHighlight.matrixWorld);
                    outlineData.mesh.quaternion.setFromRotationMatrix(objectToHighlight.matrixWorld);
                    outlineData.mesh.scale.setFromMatrixScale(objectToHighlight.matrixWorld).multiplyScalar(1.05);
                }
            }
        }
    } else {
        if (this.hoveredObject) {
            this.clearAllHighlights();
            this.hoveredObject = null;
        }
    }
  }
  
  animate = () => {
      requestAnimationFrame(this.animate);
      
      // Update all visible outline meshes
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