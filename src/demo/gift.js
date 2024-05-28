import * as THREE from 'three';
import model from './model'; // 引入机器人模型
import { hexagons } from './ground'; // 引入六棱柱的边界框

// 创建纹理加载器
const textureLoader = new THREE.TextureLoader();

// 创建红色方块材质
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// 创建一个组来存放所有的小方块
const giftGroup = new THREE.Group();

// 随机生成小方块
const numberOfGifts = 10; // 生成的小方块数量
const giftSize = 1; // 小方块的边长

// 定义一个函数来检查是否重叠
function isOverlapping(x, z, size) {
  const margin = 0.1; // 额外的边距
  const bbox = new THREE.Box3(
    new THREE.Vector3(x - size / 2 - margin, 0, z - size / 2 - margin),
    new THREE.Vector3(x + size / 2 + margin, 0, z + size / 2 + margin)
  );

  return hexagons.some(hex => hex.intersectsBox(bbox)) ||
         bbox.containsPoint(model.position); // 检查是否与六棱柱或机器人重叠
}

for (let i = 0; i < numberOfGifts; i++) {
  // 创建小方块几何体
  const boxGeometry = new THREE.BoxGeometry(giftSize, giftSize, giftSize);

  // 创建小方块网格
  const giftMesh = new THREE.Mesh(boxGeometry, redMaterial);

  // 随机设置小方块的位置
  let x, z;
  do {
    x = Math.random() * 40 - 20; // x坐标范围：-20到20
    z = Math.random() * 40 - 20; // z坐标范围：-20到20
  } while (isOverlapping(x, z, giftSize)); // 确保不与六棱柱和机器人重叠

  // 将小方块设置在地面上方
  const y = giftSize / 2 +2; // 假设地面的y坐标为0，所以小方块的y坐标为giftSize的一半

  giftMesh.position.set(x, y, z);
  giftMesh.castShadow = true;

  // 将小方块添加到组中
  giftGroup.add(giftMesh);

  // 添加晃动效果
  const offset = Math.random() * 1000; // 每个方块一个随机的时间偏移量
  giftMesh.userData.offset = offset;
}

// 更新晃动效果
giftGroup.tick = (delta) => {
  const time = Date.now() * 0.001; // 获取当前时间，以秒为单位
  giftGroup.children.forEach((giftMesh, index) => {
    const offset = giftMesh.userData.offset;
    const originalY = giftSize / 2 +2; // 初始y坐标
    giftMesh.position.y = originalY + Math.sin(time + offset) * 0.5; // y坐标随着时间上下晃动，振幅为0.5
  });
};

export default giftGroup;
