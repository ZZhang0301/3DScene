// tree.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { hexagons } from './ground';
import model from './model';

const loader = new GLTFLoader();
const treePromise = new Promise((resolve, reject) => {
    loader.load(
        './src/assets/models/Tree.glb',
        function (treeData) {
            const trees = [];
            const treeModel = treeData.scene.children[0];
            const numberOfTrees = 5;
            const treeScale = new THREE.Vector3(2, 2, 2);

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

            for (let i = 0; i < numberOfTrees; i++) {
                const treeClone = treeModel.clone();
                let x, z;
                do {
                    x = Math.random() * 70 - 40; // x坐标范围：-20到20
                    z = Math.random() * 70 - 40; // z坐标范围：-20到20
                } while (isOverlapping(x, z, 4)); // 假设树的直径为4

                treeClone.position.set(x, 0, z);
                treeClone.scale.copy(treeScale);
                trees.push(treeClone);
            }

            resolve(trees);
        },
        undefined,
        reject
    );
});

export default treePromise;
