import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

class Scene3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.highlightableObjects = new Map(); // Map to store named objects/groups
        this.outlineMeshes = new Map(); // Map to store outline meshes
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line.threshold = 0.1; // Improve line detection
        this.raycaster.params.Points.threshold = 0.1; // Improve point detection

        //Objects
        this.football = null;
        this.flag = null;
        this.case = null;
        this.pc = null;
        this.book = null;
        
        this.initRenderer();
        this.initCamera();
        this.initControls();
        this.initLights();
        this.initEventListeners();
        this.loadModel();
        
        // Start animation loop
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
        this.camera.position.set(2, 1.5, 2);
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
          child.name === 'Flag' ||
          child.name === 'Case' ||
          child.name === 'PC_Screen' ||
          child.name === 'Books' ){
            if (child.isMesh) {
                child.castShadow = true;
                
                // Check if the object has a name
                if (child.name) {
                    // Store the object in our map
                    this.highlightableObjects.set(child.name, child);
                    this.createOutlineMesh(child, outlineMaterial);
                }
            } else if (child.isGroup && child.name) {
                // Handle named groups
                this.highlightableObjects.set(child.name, child);
                
                // Create outline meshes for all meshes in the group
                child.traverse((groupChild) => {
                    if (groupChild.isMesh) {
                        this.createOutlineMesh(groupChild, outlineMaterial);
                    }
                });
            }
          }
          if (child.name === 'Football'){
            this.football = child;
          }
          else if (child.name === 'Flag'){
            this.flag = child;
          }
          else if (child.name === 'Case'){
            this.case = child;
          }
          else if (child.name === 'PC_Screen'){
            this.pc = child;
          } else if (child.name === 'Books'){
            this.book = child;
          }
      });
    }

    createOutlineMesh(object, material) {
      const outlineGeometry = object.geometry.clone();
      const outlineMesh = new THREE.Mesh(outlineGeometry, material.clone());
      
      outlineMesh.position.copy(object.position);
      outlineMesh.rotation.copy(object.rotation);
      outlineMesh.scale.copy(object.scale);
      outlineMesh.scale.multiplyScalar(1.05);
      outlineMesh.visible = false;
      
      // Store the outline mesh with reference to its original object
      this.outlineMeshes.set(object.uuid, outlineMesh);
      object.parent.add(outlineMesh);
    }

    clearAllHighlights() {
      this.outlineMeshes.forEach((mesh) => {
          mesh.visible = false;
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
                      const outlineMesh = this.outlineMeshes.get(child.uuid);
                      if (outlineMesh) {
                          outlineMesh.material.color.setHex(highlightColor);
                          outlineMesh.visible = true;
                      }
                  }
              });
          } else {
              const outlineMesh = this.outlineMeshes.get(object.uuid);
              if (outlineMesh) {
                  outlineMesh.material.color.setHex(highlightColor);
                  outlineMesh.visible = true;
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
                            const outlineMesh = this.outlineMeshes.get(child.uuid);
                            if (outlineMesh) {
                                outlineMesh.visible = true;
                                outlineMesh.material.color.setHex(0xffffff);
                            }
                        }
                    });
                } else {
                    const outlineMesh = this.outlineMeshes.get(objectToHighlight.uuid);
                    if (outlineMesh) {
                        outlineMesh.visible = true;
                        outlineMesh.material.color.setHex(0xffffff);
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

    onWindowResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    initEventListeners() {
        document.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('resize', this.onWindowResize);
    }

    animate = () => {
      requestAnimationFrame(this.animate);
      
      // Update all visible outline meshes
      this.outlineMeshes.forEach((outlineMesh, uuid) => {
          if (outlineMesh.visible) {
              const originalObject = this.scene.getObjectByProperty('uuid', uuid);
              if (originalObject) {
                  // Get world position and apply it to outline
                  originalObject.updateWorldMatrix(true, false);
                  outlineMesh.position.setFromMatrixPosition(originalObject.matrixWorld);
                  outlineMesh.rotation.setFromRotationMatrix(originalObject.matrixWorld);
                  outlineMesh.scale.copy(originalObject.scale).multiplyScalar(1.05);
              }
          }
      });
      
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
  }

}

// Initialize the scene
const scene = new Scene3D('container3D');