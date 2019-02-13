/**
 * Created by hebo on 23/7/19.
 * Email: hebo@finupgroup.com
 */

(function () {

    var sound = new hb.Sound();
    sound.ready();

    var loading = new hb.Loading();

    var camera_debug = false;
    var $stage = document.querySelector("#stage");
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var clock = new THREE.Clock();
    var container;
    var globalCamera, camera, scene, renderer, controls;
    var poi_jc, poi_dc;
    var light;
    var ikSolver;

    var onRenderFcts = [];

    if (SCREEN_WIDTH > SCREEN_HEIGHT) {
        var camera_w = camera_debug ? SCREEN_WIDTH * 0.5 : SCREEN_WIDTH;
        var camera_h = SCREEN_HEIGHT
    } else {
        var camera_w = SCREEN_WIDTH;
        var camera_h = camera_debug ? SCREEN_HEIGHT * 0.5 : SCREEN_HEIGHT
    }


    function init() {
        container = document.createElement("div");
        $stage.appendChild(container);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(90, camera_w / camera_h, 1, 1000);
        controls = new THREE.DeviceOrientationControls(camera);
        if (camera_debug) {
            cameraHelper = new THREE.CameraHelper(camera);
            cameraHelper.visible = true;
            scene.add(cameraHelper);
            globalCamera = new THREE.PerspectiveCamera(50, camera_w / camera_h, 1, 10000);
            globalCamera.position.z = 2500;
            var axisHelper = new THREE.AxisHelper(500);
            scene.add(axisHelper)
        }
        scene.add(new THREE.AmbientLight(4210752, 3));
        light = new THREE.DirectionalLight(16777215, 1);
        light.position.set(0, 500, 300);
        scene.add(light);

        poi_jc = new THREE.Mesh(new THREE.BoxGeometry(0, 0, 0), new THREE.MeshBasicMaterial({
            color: 0,
            wireframe: true
        }));
        scene.add(poi_jc);
        poi_dc = new THREE.Mesh(new THREE.BoxGeometry(0, 0, 0), new THREE.MeshBasicMaterial({
            color: 16711680,
            wireframe: true
        }));
        scene.add(poi_dc);



        var markerObject3D = new THREE.Object3D;
        scene.add(markerObject3D);





/*
        ;(function(){
            var geometry = new THREE.PlaneGeometry(1,1,10,10)
            var material = new THREE.MeshBasicMaterial( {
                wireframe : true
            })
            var mesh = new THREE.Mesh(geometry, material);
            markerObject3D.add( mesh );

            var mesh = new THREE.AxisHelper
            markerObject3D.add( mesh );
        })()

*/


        renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setClearColor(0, 0.01);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        renderer.domElement.style.position = "relative";
        container.appendChild(renderer.domElement);
        renderer.autoClear = false;
        animate();
        window.addEventListener("resize", onWindowResize, false)



        var v = camera.getWorldDirection();
        var l = 400;
        var scale = 1 / Math.sqrt(v.x * v.x + v.z * v.z);
        v.x = v.x * scale;
        v.z = v.z * scale;


        var geometry = new THREE.SphereGeometry(1000, 16, 8);
        geometry.scale(-1, 1, 1);
        var material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("pvp.jpg")});
        var stage = new THREE.Mesh(geometry, material);
        stage.lookAt(new THREE.Vector3(v.x, 0, v.z));
        stage.rotateY((85 * Math.PI) / 180);
        stage.rotateZ((-4 * Math.PI) / 180);
        scene.add(stage);


        var loader = new THREE.MMDLoader();
        var modelUrl = 'models/miku/'
        loader.load( modelUrl+'miku_v2.pmd', modelUrl+'wavefile_v2.vmd', function onLoad(mesh){

            mesh.scale.set(1,1,1).multiplyScalar(1/3);

            markerObject3D.add(mesh);
            markerObject3D.position.set(0,-5,10);
            markerObject3D.rotation.set(0, 3.2,0);

            var animation = new THREE.Animation( mesh, mesh.geometry.animation );
            animation.play();

            var morphAnimation = new THREE.MorphAnimation2( mesh, mesh.geometry.morphAnimation );
            morphAnimation.play();

            ikSolver = new THREE.CCDIKSolver( mesh );

            onRenderFcts.push(function(now, delta){
                THREE.AnimationHandler.update( delta/1000 );
                ikSolver.update();
            })


        }, function onProgress(xhr){
            if ( xhr.lengthComputable ) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                if(Math.round(percentComplete, 2) ==100){
                    setTimeout(function () {
                        loading.hide();
                    },2000);
                }
                console.log( Math.round(percentComplete, 2) + '% downloaded' );
            }
        }, function onError( xhr ) {
        } );

        /*
        (function () {
            var material = new THREE.SpriteMaterial({
                map: THREE.ImageUtils.loadTexture( '秋成理财社区.png' ),
            });
            var object3d = new THREE.Sprite(material );
            object3d.scale.set( 592, 103, 10 ).multiplyScalar(1/50);
            object3d.position.set(10,0,-4);
            //object3d.position.z	= 1.4
            markerObject3D.add(object3d)
        })();
        */


    }

    function onWindowResize(event) {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        camera.aspect = camera_w / camera_h;
        camera.updateProjectionMatrix()
    }

    var previousTime = performance.now();
    requestAnimationFrame(function animate(now){
        requestAnimationFrame( animate );

        onRenderFcts.forEach(function(onRenderFct){
            onRenderFct(now, now - previousTime)
        });

        previousTime	= now
    });

    function animate() {
        var v = camera.getWorldDirection();
        requestAnimationFrame(animate);
        render();
        TWEEN.update();

        var dc = new THREE.Vector2(poi_dc.position.x, poi_dc.position.z);
        var eye = new THREE.Vector2(v.x, v.z);
        dt = dc.angle() - eye.angle();
        var dc2 = new THREE.Vector2(poi_dc.position.y, poi_dc.position.z);
        var eye2 = new THREE.Vector2(v.y, v.z);
        dt2 = dc2.angle() - eye2.angle();


        console.info(Math.abs(dt),Math.abs(dt2));

        //if (Math.abs(dt) < 0.3 && Math.abs(dt2) < 0.3) {
        if (Math.abs(dt) < 0.3 && Math.abs(dt2) < 0.3) {
            if (!targetTimeStart) {
                targetTimeStart = new Date().getTime()
            } else {
                targetTimeEnd = new Date().getTime();
                targetTime = targetTimeEnd - targetTimeStart;
                document.querySelector(".target").innerHTML = "已对准，请连续<b>3</b>秒！";
                $(".target").addClass("flash");
                if (targetTime >= 1000 && targetTime < 2000) {
                    document.querySelector(".target").innerHTML = "已对准，请连续<b>2</b>秒！"
                } else {
                    if (targetTime >= 2000 && targetTime < 3000) {
                        document.querySelector(".target").innerHTML = "已对准，请连续<b>1</b>秒！"
                    } else {
                        if (targetTime > 3000) {
                            //pgvSendClick({hottag: fileName + ".target.dc"});
                            //pvpTime.setFlag(fileName + ".staytime.after_jc");
                            document.querySelector(".target").innerHTML = "成功啦！";
                            setTimeout(function () {
                                $(".target").hide();
                                //meshPool["diaochan"].status = 4
                            }, 1000);
                            //meshPool["diaochan"].status = 6
                        }
                    }
                }
            }
        } else {
            targetTimeStart = null;
            $(".target").removeClass("flash")
        }
    }


    function render() {
        //var r = Date.now() * 0.0005;
        //var delta = clock.getDelta();
        controls.update();
        renderer.clear();
        renderer.setViewport(0, 0, camera_w, camera_h);
        renderer.render(scene, camera);
        if (camera_debug) {
            renderer.setViewport(SCREEN_WIDTH - camera_w, SCREEN_HEIGHT - camera_h, camera_w, camera_h);
            renderer.render(scene, globalCamera)
        }
    }


    $('#marker-btn').on('tap',function () {
        var id = Math.floor(Math.random() * 1024);
        var element = document.getElementById('marker');
        element.innerHTML = new ArucoMarker(id).toSVG('100%');
        $('#marker-mask').show();

        /*
        setInterval(function(){
            var domElement = document.querySelector('#marker svg')
            element.style.height = window.innerHeight-120+'px'
        }, 100)
        */
    });

    $('#marker-mask').on('tap',function () {
        $(this).hide();
    });

    init();
})();