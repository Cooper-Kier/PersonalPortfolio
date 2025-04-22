import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { showPopup } from './popup.js'; 

class Scene3D {
  constructor(containerId) {
    // Scene 
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();

    // Objects
    this.highlightableObjects = new Map();
    this.outlineMeshes = new Map();
    this.originalScales = new Map();
    this.hoveredObject = null;

    this.externalLinks = new Map([
      ['Github', 'https://github.com/Cooper-Kier'],
      ['LinkedIn', 'https://www.linkedin.com/in/cooper-kier-b2bb112a0/']
    ]);

    this.objectToPopupMap = new Map([
      ['Books', 'about'],
      ['Flag', 'about'],
      ['PC_Screen', 'projects'],
      ['Case', 'experience'],
      ['Football', 'extracurricular'],
      ['Phone', 'contact']
    ]);

    // Mouse
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line.threshold = 0.1;
    this.raycaster.params.Points.threshold = 0.1;

    // Check WebGL support before initialization
    this.initializeScene();
  }

  // Check WebGL compatibility and initialize
  initializeScene() {
    try {
      // Check if WebGL is available
      if (!this.isWebGLAvailable()) {
        const warning = this.getWebGLErrorMessage();
        this.container.appendChild(warning);
        return;
      }

      // Initialize components
      this.initRenderer();
      this.initCamera();
      this.initControls();
      this.initLights();
      this.initEventListeners();
      this.loadModel();

      // Start animation loop
      this.animate();
    } catch (error) {
      console.error("Error initializing 3D scene:", error);
      // Display fallback content
      this.displayFallbackContent();
    }
  }

  // Check if WebGL is available
  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // Display error message
  getWebGLErrorMessage() {
    const element = document.createElement('div');
    element.id = 'webgl-error-message';
    element.style.fontFamily = 'monospace';
    element.style.fontSize = '13px';
    element.style.fontWeight = 'normal';
    element.style.textAlign = 'center';
    element.style.background = '#fff';
    element.style.color = '#000';
    element.style.padding = '1.5em';
    element.style.width = '400px';
    element.style.margin = '5em auto 0';
    element.innerHTML = 'Your browser or device does not seem to support WebGL.<br>Please try using a different browser or device.';
    return element;
  }

  // Display fallback content
  displayFallbackContent() {
    const fallback = document.createElement('div');
    fallback.style.textAlign = 'center';
    fallback.style.padding = '2em';
    fallback.innerHTML = `
      <h3>3D View Not Available</h3>
      <p>Sorry, we couldn't load the 3D view. Please use the navigation links instead.</p>
      <div style="margin-top: 20px;">
        <button class="fallback-nav-btn" data-popup="about">About Me</button>
        <button class="fallback-nav-btn" data-popup="projects">Projects</button>
        <button class="fallback-nav-btn" data-popup="experience">Experience</button>
        <button class="fallback-nav-btn" data-popup="extracurricular">Leadership</button>
        <button class="fallback-nav-btn" data-popup="contact">Contact</button>
      </div>
    `;
    
    this.container.appendChild(fallback);
    
    // Add event listeners to fallback buttons
    const buttons = fallback.querySelectorAll('.fallback-nav-btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const popupId = button.getAttribute('data-popup');
        if (popupId) {
          showPopup(popupId);
        }
      });
    });
  }

  // Initializers with error handling
  initRenderer() {
    try {
      // Try with different antialias settings if needed
      this.renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false
      });
      
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
      this.renderer.physicallyCorrectLights = true;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 2.5;
      
      this.container.appendChild(this.renderer.domElement);
    } catch (error) {
      console.error("Failed to initialize renderer:", error);
      throw error; // Re-throw to be caught by initializeScene
    }
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

    // Add loading manager with better error handling
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onError = (url) => {
        console.error('Error loading:', url);
        // Try alternative path if the initial path fails
        if (url.startsWith('/models/')) {
            console.log('Trying alternate path...');
            const newUrl = url.replace('/models/', './models/');
            loader.load(
                newUrl,
                (gltf) => {
                    const object = gltf.scene;
                    this.processSceneObjects(object, outlineMaterial);
                    this.scene.add(object);
                },
                undefined,
                (error) => {
                    console.error('Failed with alternate path:', error);
                    this.displayModelLoadingError();
                }
            );
        } else {
            this.displayModelLoadingError();
        }
    };

    loader.manager = loadingManager;

    // Create a simple loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.style.position = 'absolute';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.color = 'white';
    loadingElement.style.fontSize = '18px';
    loadingElement.textContent = 'Loading 3D environment...';
    this.container.appendChild(loadingElement);

    // Try to load with both absolute and relative paths
    loader
        .load(
            '/models/Room.glb',
            (gltf) => {
                const object = gltf.scene;
                this.processSceneObjects(object, outlineMaterial);
                this.scene.add(object);
                this.container.removeChild(loadingElement);
            },
            // Progress callback
            (xhr) => {
                if (xhr.lengthComputable) {
                    const percentComplete = xhr.loaded / xhr.total * 100;
                    loadingElement.textContent = `Loading: ${Math.round(percentComplete)}%`;
                }
            },
            // Error callback
            (error) => {
                console.error('Error loading with absolute path:', error);
                console.log('Trying relative path...');
                
                // Try with relative path
                loader.load(
                    './models/Room.glb',
                    (gltf) => {
                        const object = gltf.scene;
                        this.processSceneObjects(object, outlineMaterial);
                        this.scene.add(object);
                        this.container.removeChild(loadingElement);
                    },
                    undefined,
                    (secondError) => {
                        console.error('Error loading with relative path:', secondError);
                        this.displayModelLoadingError();
                        this.container.removeChild(loadingElement);
                    }
                );
            }
        );
  }

  displayModelLoadingError() {
    const errorElement = document.createElement('div');
    errorElement.style.position = 'absolute';
    errorElement.style.top = '50%';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translate(-50%, -50%)';
    errorElement.style.color = 'white';
    errorElement.style.background = 'rgba(0,0,0,0.7)';
    errorElement.style.padding = '20px';
    errorElement.style.borderRadius = '10px';
    errorElement.style.textAlign = 'center';
    errorElement.innerHTML = `
        <h3>Couldn't load 3D model</h3>
        <p>Please use the navigation menu to explore the portfolio.</p>
    `;
    this.container.appendChild(errorElement);
  }

  // The rest of your methods remain largely unchanged
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
  
  onWindowResize = () => {
    if (!this.renderer) return;
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
      if (!this.renderer) return;
      
      requestAnimationFrame(this.animate);

      try {
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
      } catch (error) {
          console.error("Error in animation loop:", error);
          // Stop the animation loop if there's an error
          cancelAnimationFrame(this.animate);
      }
  }
}

// Initialize the scene with error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    const scene = new Scene3D('container3D');
  } catch (error) {
    console.error("Failed to initialize 3D scene:", error);
    const container = document.getElementById('container3D');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2em;">
          <h3>3D View Not Available</h3>
          <p>Sorry, we couldn't load the 3D view. Please use the navigation menu instead.</p>
        </div>
      `;
    }
  }
});
