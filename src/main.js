import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import model from './demo/model';
import groundGroup from './demo/ground';
import xue from './demo/PM';
import gift from './demo/gift';
import treePromise from './demo/tree';

const clock = new THREE.Clock();

let camera, scene, renderer, stats, controls;
let moveDirection = { forward: 0, backward: 0, left: 0, right: 0 };
let isMoving = false;
let isJumping = false;
let jumpStartY = null;
let jumpPeakReached = false;

const hexagons = []; // 存储六棱柱的边界框

function init() {
  scene = new THREE.Scene();
  scene.add(model);
  scene.add(groundGroup);
  scene.add(xue);
  scene.add(gift);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(10, 10, 10);
  camera.lookAt(model.position);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0xffffff, 15);
  spotLight.decay = 0.3;
  spotLight.angle = Math.PI / 5;
  spotLight.position.set(150, 200, 0);
  spotLight.penumbra = 0.3;
  spotLight.castShadow = true;
  scene.add(spotLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x4169E1, 1);
  document.body.appendChild(renderer.domElement);

  window.onresize = onWindowResize;
  initHelper();
  initGUI(ambientLight);
  setupKeyboardControls();

  // 添加六棱柱的边界框
  groundGroup.children.forEach((child) => {
    if (child.geometry && child.geometry.type === 'CylinderGeometry') {
      child.geometry.computeBoundingBox();
      child.updateMatrixWorld();
      const bbox = child.geometry.boundingBox.clone();
      bbox.applyMatrix4(child.matrixWorld);
      hexagons.push(bbox);
    }
  });

  // 加载并添加树模型
  treePromise.then(trees => {
    trees.forEach(tree => scene.add(tree));
  });
}

function animate() {
  const delta = clock.getDelta();

  if (isMoving) {
    updateModelPosition(delta);
  }

  if (isJumping) {
    updateJump(delta);
  }

  checkCollisions();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);

  model.tick(delta);
  gift.tick(delta); 
  updateCameraPosition();

  stats.update();
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function initHelper() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(model.position.x, model.position.y, model.position.z);
  controls.update();

  controls.enableZoom = true;
  controls.zoomSpeed = 1.0;
  controls.minDistance = 5;
  controls.maxDistance = 100;

  stats = new Stats();
  document.body.appendChild(stats.domElement);
}

function initGUI(ambientLight) {
  const gui = new GUI();
  gui.add(ambientLight, 'intensity', 0, 4).name('环境光强度');
}

function setupKeyboardControls() {
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'ArrowUp':
        if (!moveDirection.forward) {
          moveDirection.forward = 1;
          isMoving = true;
          model.fadeToAction('Walking', 0.5);
        }
        break;
      case 'ArrowDown':
        if (!moveDirection.backward) {
          moveDirection.backward = 1;
          isMoving = true;
          model.fadeToAction('Walking', 0.5);
        }
        break;
      case 'ArrowLeft':
        model.rotation.y += 0.1;
        break;
      case 'ArrowRight':
        model.rotation.y -= 0.1;
        break;
      case 'Space':
        if (!isJumping) {
          isJumping = true;
          jumpStartY = model.position.y;
          jumpPeakReached = false;
          model.fadeToAction('Jump', 0.2);
        }
        break;
    }
  });

  window.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'ArrowUp':
        moveDirection.forward = 0;
        break;
      case 'ArrowDown':
        moveDirection.backward = 0;
        break;
    }
    if (moveDirection.forward === 0 && moveDirection.backward === 0) {
      isMoving = false;
      model.fadeToAction('Idle', 0.5);
    }
  });
}

function updateModelPosition(delta) {
  const moveSpeed = 5;
  const moveStep = moveSpeed * delta;
  const direction = new THREE.Vector3();

  if (moveDirection.forward) {
    direction.set(0, 0, 1);
  } else if (moveDirection.backward) {
    direction.set(0, 0, -1);
  }

  direction.applyQuaternion(model.quaternion);

  const newPosition = model.position.clone().addScaledVector(direction, moveStep);

  // 检查碰撞
  const modelBBox = new THREE.Box3().setFromObject(model).expandByScalar(-0.1); // 添加一个小的缩小量以避免精确重叠导致的问题
  const collision = hexagons.some(hex => hex.intersectsBox(modelBBox));

  if (!collision) {
    model.position.copy(newPosition);
  }
}

function updateJump(delta) {
  const jumpSpeed = 5;
  const jumpHeight = 2;
  const moveStep = jumpSpeed * delta;

  if (!jumpPeakReached) {
    model.position.y += moveStep;
    if (model.position.y >= jumpStartY + jumpHeight) {
      jumpPeakReached = true;
    }
  } else {
    model.position.y -= moveStep;
    // 检查是否有六棱柱在机器人下面
    const modelBBox = new THREE.Box3().setFromObject(model);
    const hexagonBelow = hexagons.find(hex => hex.containsPoint(new THREE.Vector3(model.position.x, model.position.y - moveStep, model.position.z)));

    if (hexagonBelow) {
      model.position.y = hexagonBelow.max.y;
      isJumping = false;
      model.fadeToAction('Idle', 0.5);
    } else if (model.position.y <= jumpStartY) {
      model.position.y = jumpStartY;
      isJumping = false;
      model.fadeToAction('Idle', 0.5);
    }
  }
}

function checkCollisions() {
  const modelBBox = new THREE.Box3().setFromObject(model);

  gift.children.forEach((giftMesh, index) => {
    const giftBBox = new THREE.Box3().setFromObject(giftMesh);
    if (modelBBox.intersectsBox(giftBBox)) {
      // 移除碰撞的小方块
      gift.remove(giftMesh);
    }
  });
}

function updateCameraPosition() {
  const offsetX = 10; // 调整相机相对于机器人的水平偏移量
  const offsetY = 5;  // 调整相机相对于机器人的垂直偏移量
  const offsetZ = 10; // 调整相机相对于机器人的深度偏移量

  const cameraOffset = new THREE.Vector3(offsetX, offsetY, offsetZ);
  cameraOffset.applyQuaternion(model.quaternion);
  camera.position.copy(model.position).add(cameraOffset);
  camera.lookAt(model.position);
}

// 初始化函数
init();
animate();
