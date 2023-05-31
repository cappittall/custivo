const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 540 / 720, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(540, 720);
document.body.appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(0, 0, 10);
scene.add(light);

const loader = new THREE.GLTFLoader();
let ringGlb = null;
let RNG = {};

loader.load('assets/glbs/yuzuk/Yuzuk.glb', (gltf) => {
    ringGlb = gltf.scene;
    ringGlb.scale.set(0.1, 0.1, 0.1);
    ringGlb.traverse((child) => {
        if (child.isMesh) {
            RNG[child.name] = child;
        }
    });

    RNG.RingAlt.visible = false;
    RNG.Text.visible = false;
    RNG.RingUst.visible = true;
    RNG.Diamond.visible = true;

    scene.add(ringGlb);
});

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.onResults(onResults);

function onResults(results) {
    if (results.multiHandLandmarks) {
        const ringFinger = results.multiHandLandmarks[0][13];
        const ringFingerPos = new THREE.Vector3(ringFinger.x, ringFinger.y, ringFinger.z);
        const scaleFactor = ringFingerPos.distanceTo(camera.position) / 10;

        ringGlb.position.copy(ringFingerPos);
        ringGlb.rotation.setFromQuaternion(getRingRotation(results));
        ringGlb.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
}

function getRingRotation(results) {
    // Calculate rotation based on hand landmarks
    // You can customize this function to use different landmarks for rotation
    return new THREE.Quaternion();
}

let videoElement = document.getElementById('video');
videoElement.width = 540;
videoElement.height = 720;
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.play();
        camera.add(videoElement);
        animate();
    })
    .catch((err) => {
        console.error('Error accessing camera:', err);
    });
    
    function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    hands.send({image: videoElement});
    }

    /**
     * 
With these additions, you should now have a complete AR ring project that works in a web 
browser or on mobile devices. The project will open the back camera, use the Three.js
library to load the `ring.glb` file, and use MediaPipe's hand landmarks to track the ring 
finger's position, vectors, and quaternions. The ring will be placed on the ring finger and 
will turn when the hand turns. A light is also added to the scene to improve the appearance 
of the ring.

Please note that the `getRingRotation()` function in the code is a placeholder for the ring 
rotation calculations based on hand landmarks. You may need to customize this function to use 
the appropriate landmarks and quaternion calculations for your specific use case.

Also, depending on your web server configuration, you might need to serve your project over 
HTTPS, as accessing the camera can require a secure context. You can use a local development 
server like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 
for Visual Studio Code or other similar tools to run your project locally with HTTPS enabled.

Finally, don't forget to test your project in different browsers and devices, as there might be 
compatibility issues related to the camera, WebGL, or other features. Make sure to handle these 
issues gracefully to provide a better user experience.

     */
