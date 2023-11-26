import * as SPLAT from "gsplat";
import * as THREE from "three";

const scale = 1
const movement_scale = 5
const initial_z = 14

let trenderer:any, xrRefSpace:any, tscene:any, tcamera:any;
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera(
    new SPLAT.Vector3(0, 0, -5),
    new SPLAT.Quaternion(),
    2232 / 4,
    2232 / 4,
    0.03,
    100
)
const renderer = new SPLAT.WebGLRenderer();
// remove background color from renderer
renderer.domElement.style.background = "unset";
renderer.setSize(window.innerWidth, window.innerHeight);

async function convertPLYToSPLAT(url: string) {
    // Load PLY file into scene
    await SPLAT.PLYLoader.LoadAsync(url, scene, (progress:any) => {
        console.log("Loading ply file: " + progress);
    });
    scene.rotate(new SPLAT.Quaternion(-1, 0, 0, 0))
    scene.scale(new SPLAT.Vector3(12*scale, 12*scale, 12*scale))
    // Scene.data is in SPLAT format
    return scene.data;
}

function getXRSessionInit(mode:any, options:any) {
    if ( options && options.referenceSpaceType ) {
        trenderer.xr.setReferenceSpaceType( options.referenceSpaceType );
    }
    var space = (options || {}).referenceSpaceType || 'local-floor';
    var sessionInit = (options && options.sessionInit) || {};

    // Nothing to do for default features.
    if ( space == 'viewer' )
        return sessionInit;
    if ( space == 'local' && mode.startsWith('immersive' ) )
        return sessionInit;

    // If the user already specified the space as an optional or required feature, don't do anything.
    if ( sessionInit.optionalFeatures && sessionInit.optionalFeatures.includes(space) )
        return sessionInit;
    if ( sessionInit.requiredFeatures && sessionInit.requiredFeatures.includes(space) )
        return sessionInit;

    var newInit = Object.assign( {}, sessionInit );
    newInit.requiredFeatures = [ space ];
    if ( sessionInit.requiredFeatures ) {
        newInit.requiredFeatures = newInit.requiredFeatures.concat( sessionInit.requiredFeatures );
    }
    return newInit;
 }

function init(){
    tscene = new THREE.Scene();
    tcamera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.01, 50 );
    trenderer = new THREE.WebGLRenderer( { antialias: true } );
    trenderer.setPixelRatio( window.devicePixelRatio );
    trenderer.setSize( window.innerWidth, window.innerHeight );
    trenderer.xr.enabled = true;
}


function AR(){
  var currentSession:any = null;
  function onSessionStarted( session:any ) {
      session.addEventListener( 'end', onSessionEnded );
      trenderer.xr.setSession( session );
      button.style.display = 'none';
      button.textContent = 'EXIT AR';
      currentSession = session;
      session.requestReferenceSpace('local').then((refSpace:any) => {
        xrRefSpace = refSpace;
        session.requestAnimationFrame(onXRFrame);
      });
  }
  function onSessionEnded( /*event*/ ) {
      currentSession.removeEventListener( 'end', onSessionEnded );
      trenderer.xr.setSession( null );
      button.textContent = 'ENTER AR' ;
      currentSession = null;
  }
  if ( currentSession === null ) {

      let options = {
        requiredFeatures: ['dom-overlay'],
        domOverlay: { root: document.body },
      };
      var sessionInit = getXRSessionInit( 'immersive-ar', {
          mode: 'immersive-ar',
          referenceSpaceType: 'local', // 'local-floor'
          sessionInit: options
      });
    //   fails on http
      (navigator.xr as any).requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );
  } else {
      currentSession.end();
  }
  trenderer.xr.addEventListener('sessionstart',
      function(ev:any) {
          console.log('sessionstart', ev);
      });
  trenderer.xr.addEventListener('sessionend',
      function(ev:any) {
          console.log('sessionend', ev);
      });
}

function onXRFrame(t:any, frame:any) {
  const session = frame.session;
  session.requestAnimationFrame(onXRFrame);
  const baseLayer = session.renderState.baseLayer;
  const pose = frame.getViewerPose(xrRefSpace);

  trenderer.render( tscene, tcamera );  
  camera._position.x = scale*movement_scale*tcamera.position.x;
  camera._position.y = -scale*movement_scale*tcamera.position.y-1;
  camera._position.z = -scale*movement_scale*tcamera.position.z-initial_z;
  camera._rotation.x = tcamera.quaternion.x;
  camera._rotation.y = -tcamera.quaternion.y;
  camera._rotation.z = -tcamera.quaternion.z;
  camera._rotation.w = tcamera.quaternion.w;
}

async function main() {

    // standard gaussian splat example
    // const url = "https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat";
    // await SPLAT.Loader.LoadAsync(url, scene, () => {});

    // dreamgaussian example
    const url = "/src/fantasy_castle1_model.ply";
    const data = await convertPLYToSPLAT(url);

    const frame = () => {
        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
}

init()

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
window.addEventListener("resize", onWindowResize);

var button = document.createElement( 'button' );
button.id = 'ArButton'
button.textContent = 'ENTER AR' ;
button.style.cssText+= `position: absolute;top:80%;left:40%;width:20%;height:2rem;`;
    
document.body.appendChild(button)
button.addEventListener('click',x=>AR())

main();
