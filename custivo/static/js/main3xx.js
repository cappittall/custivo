// Define global variables
const _settings = {
    url: "https://www.custivo.com",
    NN: './WRRH/neuralNets/NN_OBJMANIP_7.json',
    modelPath: 'assets/glbs/yuzuk/Yuzuk.glb'
}

const _defaultThree = {
    renderer: null,
    scene: null,
    camera: null,
    loadingManager: null,
    tracker: null,
    containerObjectControls: null,
    fullObject: null,
    loadingObject: null,
    blobShadowUniforms: null,
    hologramAlphaDst: null,
    hologramUniforms: null,
    loadingMaterial: null
  }
const _three = Object.assign({}, _defaultThree);

const mpHands = window;
const drawingUtils = window;
const controls = window;
const controls3d = window;
let videoElement ;

const SCALE_FACTOR = 0.8;
let skeleton;
const offsetPos = new THREE.Vector3(0.5, -0.5,-0.00);
const offsetRot =[1.58,0,0 ];
const RNG = {};
let isControl = true;
let landmarks = [];
let ringGlb = null;
let handWMax = 0;
let handWMin = 0;
let soption="scale";
let solToSag = false;
let _isSelfieCam = true;
let screnScale = 1;
let currentDeviceId;
let threshold = 0.8;
const _states = {
    notLoaded: -1,
    loading: 0,
    idle: 1,
    running: 2,
    busy: 3
  };
let state = _states.notLoaded;

function is_mobileOrTablet(){
    let check = false;
    // from https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
        check = true;
    }
    return check;
  }

  function setFullScreen(cv){
    console.log('setFullScreen', cv);
    const dpr = window.devicePixelRatio || 1;
    cv.width = window.innerWidth * dpr;
    cv.height = window.innerHeight * dpr;
  }


// entry point:
function main(){
    state = _states.loading;

  
    const output_canvas = document.getElementById('output_canvas');
    const output_canvas_glb = document.getElementById('output_canvas_glb');
  
    setFullScreen(output_canvas);
    setFullScreen(output_canvas_glb);
  
    WEBARROCKSHAND.init({
      canvasId: 'output_canvas_glb',
      NNsPaths: ['./WRRH/neuralNets/NN_RING_14.json'], // path to JSON neural networks models
      callbackReady: start,
    
      // called at each render iteration (drawing loop)
      callbackTrack: callbackTrack //end callbackTrack()
    });//end init call
} // end main

// start callback: 
function callbackTrack(detectState){
    console.log('1. check: callbackTrack', detectState);

   
  } // end callbackTrack

// start function:

function start(three){
    // pause handtracker until 3D assets are not loaded
    console.log('2. check: start.pouse');
    WEBARROCKSHAND.toggle_pause(true);
    console.log('3. check: start.endPause');
  
    if (!is_mobileOrTablet()){
      // for desktop computer, hide Flip camera button and mirror canvas:
      // document.getElementById('flipButton').style.display = 'none';
      mirror_canvases(true);
    }
  
    // set tonemapping:
    console.log('148.INFO in main.js: three.renderer: ', three)

    const scene = new THREE.Scene();
    //scene.background = new THREE.Color('rgba(255, 255, 255, 0)');
    scene.fog = new THREE.Fog( 0xa0a0a0, 10, 5 );
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.matrixAutoUpdate = false;
    camera.position.set(1, 1, 1);
  
    // load the velociraptor loading 3D model:
    new THREE.GLTFLoader(three.loadingManager).load(_settings.modelPath, function(gltf){
        console.log('hand scene: ',gltf.scene);
        ringGlb = gltf.scene;
        ringGlb.scale.set(0.01, 0.01, 0.01);
        ringGlb.position.set(1, 1, -0.1);
        
        // handglb.visible = false;
        ringGlb.traverse((child) => {
            console.log('Traverse child: ',child)
            
            if (child.isMesh) {
                RNG[child.name] = child;
            }
        }); 
        // Initial rotation
        const eulor = new THREE.Euler(offsetRot[0], offsetRot[1], offsetRot[2]); 
        ringGlb.rotation.copy(eulor);
      
    });
    
      hide_DOMLoading();
      hide_instructions();
      WEBARROCKSHAND.toggle_pause(false);
      _state = _states.running;

  } //end start()

  function mirror_canvases(isMirror){
    _isSelfieCam = isMirror;
    document.getElementById('canvases').style.transform = (isMirror) ? 'rotateY(180deg)' : '';
  } // end mirror_canvases

  // hide loading:
  function hide_DOMLoading(){
    // remove loading:
    const domLoading = document.getElementById('loading');
    if (!domLoading){
      return;
    }
    domLoading.style.opacity = 0;
    setTimeout(function(){
        console.log('3. check: hide loading');
      domLoading.parentNode.removeChild(domLoading);
    }, 800);
  } // end hide_DOMLoading()


  async function hide_instructions(){
    const domInstructions = document.getElementById('instructions');
    if (!domInstructions){
      return;
    }
    domInstructions.style.opacity = 0;
    _isInstructionsHidden = true;
    _state = _states.running;

    videoElement = document.createElement('video');
    videoElement.id="inputVideo";
    videoElement.autoplay = true;
    videoElement.muted = true;
   
    // initially set other device
    const result= await turnVideo(handleVideo(is_mobileOrTablet ? "environment" : "user"));
    console.log("Video result", result);
    setTimeout(function(){
      domInstructions.parentNode.removeChild(domInstructions);
      document.getElementById('control-buttons').style.display = 'flex';
      document.getElementById('control-buttons').offsetHeight;
    }, 800);
  }


  window.addEventListener('load', main);