import * as THREE from 'three';

const vertices = [];
const velocities = [];
const maxVelocity = 0.5;
const snowflakeCount = 2000;
const fallSpeed = 0.2;
const fadeStartHeight = 50;
const fadeEndHeight = -50;

for (let i = 0; i < snowflakeCount; i++) {
  const x = Math.random() * 2000 - 1000;
  const y = Math.random() * 2000;
  const z = Math.random() * 2000 - 1000;
  vertices.push(x, y, z);

  const vx = (Math.random() - 0.5) * maxVelocity;
  const vy = (Math.random() - 0.5) * maxVelocity;
  const vz = (Math.random() - 0.5) * maxVelocity;
  velocities.push(vx, vy, vz);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(new Array(snowflakeCount).fill(1.0), 1));

function getTexture() {
  return new THREE.TextureLoader().load('src/assets/xue.png');
}

const material = new THREE.PointsMaterial({
  size: 10,
  transparent: true,
  map: getTexture(),
  blending: THREE.NormalBlending,
  opacity: 1.0,
  depthTest: false
});

const points = new THREE.Points(geometry, material);

function updateSnowflakes(delta) {
  const positions = geometry.attributes.position.array;
  const alphas = geometry.attributes.alpha.array;
  const velocityArray = geometry.attributes.velocity.array;

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += velocityArray[i];
    positions[i + 1] -= fallSpeed;
    positions[i + 2] += velocityArray[i + 2];

    // Update alpha based on height
    if (positions[i + 1] < fadeStartHeight) {
      alphas[i / 3] = (positions[i + 1] - fadeEndHeight) / (fadeStartHeight - fadeEndHeight);
    } else {
      alphas[i / 3] = 1.0;
    }

    // Reset snowflake if it goes below the fadeEndHeight
    if (positions[i + 1] < fadeEndHeight) {
      positions[i + 1] = Math.random() * 2000;
      positions[i] = Math.random() * 2000 - 1000;
      positions[i + 2] = Math.random() * 2000 - 1000;
      alphas[i / 3] = 1.0;
    }

    // Bounce off the walls
    if (positions[i] > 1000 || positions[i] < -1000) velocityArray[i] = -velocityArray[i];
    if (positions[i + 2] > 1000 || positions[i + 2] < -1000) velocityArray[i + 2] = -velocityArray[i + 2];
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.alpha.needsUpdate = true;
  material.opacity = 1.0; // Ensure material opacity is 1 for correct alpha blending
}

function animate() {
  requestAnimationFrame(animate);
  updateSnowflakes();
}

// Start the animation loop
animate();

export default points;
