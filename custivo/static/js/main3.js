const SCALE_FACTOR = 0.40;
const POSITION_SCALE_FACTOR = 2; // Adjust this value to match the movement of the hand and the ring mesh

let skeleton;
const offsetPos = new THREE.Vector3(-1, 0, -1);
const offsetRot = [1.60, 0.1, 0];
const RNG = {};
let isControl = true;
let landmarks;
let classification;
let ringGlb = null;
let handWMax = 0;
let handWMin = 0;
let soption="scale";
let solToSag = false;
let _isSelfieCam = true;
let screnScale = 1;
let currentDeviceId;
const _states = { notLoaded: -1, loading: 0, idle: 1, running: 2, busy: 3 };
let _state = _states.notLoaded;

const videoElement = document.getElementById('video');
const canvas2D = document.getElementById('canvas2d');
const canvas3D = document.getElementById('canvas3d');
const canvasCtx = canvas2D.getContext('2d');
const gl = canvas3D.getContext("webgl3", {xrCompatible: true});

const xSlider = document.getElementById('x-slider');
const xValue = document.getElementById('x-slider-value');
const ySlider = document.getElementById('y-slider');
const yValue = document.getElementById('y-slider-value');
const zSlider = document.getElementById('z-slider');
const zValue = document.getElementById('z-slider-value');


let width = window.innerWidth;
let height = window.innerHeight;
canvas3D.width = width * screnScale
canvas3D.height = height * screnScale

const spinner = document.querySelector('#spinnerLoading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};

// Three .js consts
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const loader = new THREE.GLTFLoader();

// Three .js initial sets
camera.matrixAutoUpdate = true;
camera.position.set(0, 0, 1);


async function hide_instructions(){
    const domInstructions = document.getElementById('instructions');
    if (!domInstructions){
      return;
    }
    domInstructions.style.opacity = 0;
    _isInstructionsHidden = true;
    _state = _states.running;
    screnScale = 2;
    // initially set other device
  
    set_canvasMirroring(_isSelfieCam)

    setTimeout(function(){
      // domInstructions.parentNode.removeChild(domInstructions);
      document.getElementById('control-buttons').style.display = 'flex';
      document.getElementById('control-buttons').offsetHeight;
    }, 800);
}

function set_canvasMirroring(isMirror){
  isMirror = !isMirror
  console.log('IS MIRROR ', isMirror )
    video.style.transform = (isMirror) ?  '':'rotateY(180deg)' ;
    canvas2D.style.transform = (isMirror) ? 'rotateY(180deg)': '' ;
    canvas3D.style.transform = (isMirror) ? 'rotateY(180deg)': '' ;
}

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Draw the overlays.
    canvasCtx.clearRect(0, 0, video.clientWidth, video.clientHeight);

    if (results.multiHandLandmarks && results.multiHandedness && ringGlb != null) {
        if (results.multiHandLandmarks.length ==0){return};
       
        classification = results.multiHandedness[0];
        landmarks = results.multiHandLandmarks[0];
        // Draw the hand annotations.
        render();
        scaleHandSize(landmarks);
        if (isControl) {
            updateHand(ringGlb, landmarks);
        }
    } else {
      document.getElementById('instructions').style.opacity = 1;
    }
}
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.onResults(onResults);
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  selfieMode: _isSelfieCam,
});

const camerax = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 540,
  height: 720,

});
camerax.start();

function loadMesh() {
    loader.load('assets/glbs/yuzuk/Yuzuk.glb', async (gltf) => {
            console.log('hand scene: ',gltf.scene);
            ringGlb = gltf.scene;
            ringGlb.scale.set(0.1, 0.1, 0.1);
            ringGlb.position.set(1, 1, -0.1);
            // ringGlb.visible = false;
            ringGlb.traverse((child) => {
                console.log('Traverse child: ',child)
                if (child.isMesh) {
                    RNG[child.name] = child;
                }
            }); 
            // Initial rotation
            const eulor = new THREE.Euler(offsetRot[0], offsetRot[1], offsetRot[2]); 
            ringGlb.rotation.copy(eulor);
            // Hide half of the Ring
            scene.add(ringGlb);
            reConfigureSlider("scale", ringGlb); 
            
    });
}


function initLigtings() {
  const light = new THREE.AmbientLight( 0x404040 )
  // light.position.set(1, 1, 100);
  scene.add(light);  
  const spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set(0, 1, 100 );
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = window.innerWidth;
  spotLight.shadow.mapSize.height = window.innerHeight;
  spotLight.shadow.camera.near = 500;
  spotLight.shadow.camera.far = 4000;
  spotLight.shadow.camera.fov = 30;
  scene.add( spotLight ); 
}

const renderer = new THREE.WebGLRenderer( { 
    alpha: true,
    preserveDrawingBuffer: true,
    canvas: canvas3D,
    context: gl
} );  


function scaleHandSize(landmarks) {
  // Calculate the distance between two landmarks
  const referenceToAdjacent = new THREE.Vector3().subVectors(landmarks[14], landmarks[0]);
  const distance = referenceToAdjacent.length();

  // SCALE_FACTOR should represent the "normal" distance between your two chosen landmarks
  const NORMAL_DISTANCE = SCALE_FACTOR;

  // Calculate the scale factor relative to the "normal" distance
  const scaleFactor = distance / NORMAL_DISTANCE;

  // Scale the ring accordingly
  ringGlb.scale.set(scaleFactor, scaleFactor, scaleFactor);
  ringGlb.updateMatrix();
}

function updateRotation(ringGlb, landmarks){
     
  const hw = landmarks[17].x - landmarks[5].x; // handmark difference 
  if (handWMax < hw) handWMax = hw;
  if (handWMin > hw) handWMin = hw;

  solToSag = landmarks[9].z > landmarks[13].z ? 1:-1;
  console.log('solToSag', solToSag)
  // Rotate ring mesh based on the hand size hw value
  const rotate = 1+(hw - 0.49) * (1 - (-1)) / (-0.10 - 0.49) + (-1)
  text = classification.label === "Right"? "Sağ" : "Sol";

  if (isControl) ringGlb.rotation.z =  (solToSag * rotate) ;

  if (hw > handWMax * 0.33) {
      RNG.RingAlt.visible=false;
      RNG.Text.visible=false;
      RNG.RingUst.visible=true;
      RNG.Diamond.visible=true;
      
      text += " El -DIŞI ";
  } else if (hw < handWMax * 0.70 && hw > -handWMax * 0.30 ) { 
      text += " El -YAN ";
      RNG.RingAlt.visible=false;
      RNG.Text.visible=false;
      RNG.RingUst.visible=true;
      RNG.Diamond.visible=true;
  } else {
      text += " El -İÇİ ";  
      RNG.RingAlt.visible=true;
      RNG.Text.visible=true;
      RNG.RingUst.visible=false;
      RNG.Diamond.visible=false;
         
  }
  text += 'Rot Z: ' + (solToSag * rotate).toFixed(2).toString();

    canvasCtx.font = "10px Verdana";
    var gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop("1.0", "red");
    canvasCtx.fillStyle = gradient
    canvasCtx.fillText( text, 10, 10 ); 
}

function updateHand(ringGlb, landmarks) {
    if (landmarks.length === 0) { return; }
    const landmark13 = new THREE.Vector3(landmarks[13].x, landmarks[13].y, landmarks[13].z);
    const landmark14 = new THREE.Vector3(landmarks[14].x, landmarks[14].y, landmarks[14].z);
    const position = new THREE.Vector3().addVectors(landmark13, landmark14).multiplyScalar(0.5);
  
    // Apply the position scaling factor
    position.multiplyScalar(POSITION_SCALE_FACTOR);
  
    const direction = new THREE.Vector3().subVectors(landmark14, landmark13).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, direction).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(direction, right).normalize();
    const rotationMatrix = new THREE.Matrix4().lookAt(direction, correctedUp, right);
    const ringQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
  
    ringGlb.position.copy(position.add(offsetPos));
    ringGlb.position.y = 1 - ringGlb.position.y;
    ringGlb.updateMatrix();
    ringGlb.quaternion.copy(ringQuaternion);
  
    console.log('Position : ', ringGlb.position);
    updateRotation(ringGlb, landmarks)
}


//renderer.autoClear = false;
function render() {
    //renderer.clearDepth();
    requestAnimationFrame( render );
    renderer.render( scene, camera)   
}

function onWindowResize() {
  console.log('resizing...');
  camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	// renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setPixelRatio( window.devicePixelRatio );
  render();
}

// Slider 
function reConfigureSlider(soption, ringGlb) {
    const val = ringGlb[soption] // soption=="scale"?scl:soption=="rotation"?rot: soption=="position"?pos:qur;
    console.log(soption, ' val: ',val);
    xValue.innerHTML = xSlider.value = val.x.toFixed(3);
    yValue.innerHTML = ySlider.value = val.y.toFixed(3);
    zValue.innerHTML = zSlider.value = val.z.toFixed(3);
}
// Define the event listener function
const inputHandler = (event) => {
    const { target: { value } } = event;
    document.getElementById(`${event.target.id}-value`).textContent = value; // Get the span element
    ringGlb[soption].set(parseFloat(xSlider.value), parseFloat(ySlider.value), parseFloat(zSlider.value));
    ringGlb.updateMatrixWorld();
    //  

};
// Add the event listener to all three sliders
[xSlider, ySlider, zSlider].forEach(slider => {
    slider.addEventListener('input', inputHandler);
});

// get option-value
document.getElementById('select-option').onchange = function() {
        soption = this.value;
        reConfigureSlider(soption, ringGlb) 
};
////// end of hand control /////

const controlContainer= document.getElementById('controlContainer')
document.getElementById('toggleButton').onclick = function() {
    console.log('toggle');
    controlContainer.style.display =  controlContainer.style.display=='none'? 'block':'none';
    isControl = controlContainer.style.display=='none'? true:false;

}

function init(){
  initLigtings();
  loadMesh();
  render();


}
window.addEventListener( 'resize', onWindowResize, false );
document.onload = controlContainer.style.display = 'none';
init()