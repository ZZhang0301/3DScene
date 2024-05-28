import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function setupModel(data) {
    const model = data.scene.children[0];
    const mixer = new THREE.AnimationMixer(model);

    const animations = {};
    data.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        animations[clip.name] = action;
    });

    let activeAction = animations['Idle'];

    const api = {
        state: 'Idle'
    };

    function fadeToAction(name, duration) {
        const previousAction = activeAction;
        activeAction = animations[name];

        if (previousAction !== activeAction) {
            previousAction.fadeOut(duration);
        }

        activeAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play();
    }

    model.tick = (delta) => mixer.update(delta);
    model.fadeToAction = fadeToAction;
    model.api = api;
    model.position.set(0, 0, 0);
    model.mixer = mixer;

     // 计算并设置机器人的边界框
     model.geometry = new THREE.BoxGeometry(); // 假设模型是 BoxGeometry，如果不是，替换为合适的几何体
     model.geometry.computeBoundingBox();
     model.updateMatrixWorld();
     model.bbox = new THREE.Box3().setFromObject(model);

    return model;
}

const loader = new GLTFLoader();
const RobotExpressiveData = await loader.loadAsync('./src/assets/models/RobotExpressive.glb');
const RobotExpressive = setupModel(RobotExpressiveData);
RobotExpressive.castShadow = true;

export default RobotExpressive;
