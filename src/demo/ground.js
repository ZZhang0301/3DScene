import * as THREE from 'three';

// 创建贴图加载器
const textureLoader = new THREE.TextureLoader();

// 加载地面贴图
const groundTexture = textureLoader.load('src/assets/11.jpg'); // 替换为你实际的地面贴图路径
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(4, 4); // 根据需要重复贴图

// 创建圆形地面
const groundRadius = 40; // 圆形地面的半径
const groundGeometry = new THREE.CircleGeometry(groundRadius, 64); // 64边的圆形地面
const groundMaterial = new THREE.MeshLambertMaterial({
    map: groundTexture,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotateX(-Math.PI / 2);
groundMesh.position.set(0, 0, 0);
groundMesh.receiveShadow = true; // 允许接收阴影

// 创建一个组来包含所有的地面和六棱柱
const sceneGroup = new THREE.Group();
sceneGroup.add(groundMesh);

// 加载六棱柱贴图
const hexagonTexture = textureLoader.load('src/assets/OIP.jpg'); // 替换为你实际的贴图路径

// 随机生成六棱柱
const numberOfHexagons = 60; // 生成的六棱柱数量
const exclusionRadius = 3; // 排除生成的半径

const hexagons = []; // 用于存储六棱柱的边界框

for (let i = 0; i < numberOfHexagons; i++) {
    const hexagonHeight = Math.random() * 5 + 1; // 随机生成5到20之间的高度
    const hexagonRadius = 2; // 设置六棱柱的半径
    const hexagonGeometry = new THREE.CylinderGeometry(hexagonRadius, hexagonRadius, hexagonHeight, 6);
    const hexagonMaterial = new THREE.MeshLambertMaterial({
        map: hexagonTexture,
    });
    const hexagonMesh = new THREE.Mesh(hexagonGeometry, hexagonMaterial);

    // 确保六棱柱在圆形地面之内生成并不在排除区域内
    let x, z;
    do {
        x = Math.random() * 2 * groundRadius - groundRadius; // 随机生成-150到150之间的数
        z = Math.random() * 2 * groundRadius - groundRadius; // 随机生成-150到150之间的数
    } while (Math.sqrt(x * x + z * z) > groundRadius || Math.sqrt(x * x + z * z) < exclusionRadius); // 确保生成点在圆形地面之内且不在排除区域内

    hexagonMesh.position.set(x, hexagonHeight / 2, z);
    hexagonMesh.castShadow = true; // 允许投射阴影

    hexagonMesh.geometry.computeBoundingBox();
    hexagonMesh.updateMatrixWorld();
    const bbox = new THREE.Box3().setFromObject(hexagonMesh);
    hexagonMesh.bbox = bbox;
    hexagons.push(bbox); // 将边界框添加到数组中
    sceneGroup.add(hexagonMesh);
}

export default sceneGroup;
export { hexagons };
