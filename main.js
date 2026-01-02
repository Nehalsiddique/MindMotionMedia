gsap.registerPlugin(ScrollTrigger);

/* ================= STARFIELD ================= */

const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();

const isMobile = window.innerWidth < 768;

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  2600
);
camera.position.z = 110;

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: !isMobile
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const glowLight = new THREE.PointLight(0xffffff, 8, 2200);
glowLight.position.set(0, 0, 220);
scene.add(glowLight);

/* Star texture */
function createStarTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");

  const g = ctx.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.45)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const starTexture = createStarTexture();

/* Star geometry */
const STAR_COUNT = isMobile ? 1600 : 3000;
const starGeo = new THREE.BufferGeometry();
const starPos = [];
const starDepth = []; // depth factor per star

for (let i = 0; i < STAR_COUNT; i++) {
  const z = -Math.random() * 2500;
  starPos.push(
    (Math.random() - 0.5) * 1200,
    (Math.random() - 0.5) * 700,
    z
  );

  // depth factor: near = faster
  starDepth.push(1 - Math.abs(z) / 2500);
}

starGeo.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPos, 3)
);

const starMat = new THREE.PointsMaterial({
  map: starTexture,
  size: 5.2,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* ===== PROFESSIONAL MOTION MODEL ===== */

const BASE_SPEED = isMobile ? 2.6 : 3.2;
let scrollBoost = 0;

ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "bottom bottom",
  onUpdate: self => {
    const v = Math.abs(self.getVelocity());
    scrollBoost = Math.min(v / 65, isMobile ? 25 : 40);
  }
});

/* Animate */
function animate() {
  scrollBoost *= 0.9;

  const p = starGeo.attributes.position.array;

  for (let i = 0; i < p.length; i += 3) {
    const depthFactor = starDepth[i / 3];

    // ⭐ depth-based speed
    const speed =
      BASE_SPEED +
      scrollBoost * depthFactor * 1.2 +
      depthFactor * 0.8;

    p[i + 2] += speed;

    // 🌌 subtle parallax drift
    p[i] += 0.02 * depthFactor;
    p[i + 1] += 0.01 * depthFactor;

    // recycle
    if (p[i + 2] > camera.position.z + 220) {
      p[i + 2] = -2500;
    }
  }

  starGeo.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* Resize */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ================= UI ANIMATIONS ================= */

// Section fade-in
gsap.utils.toArray(".fade-section").forEach(sec => {
  gsap.from(sec, {
    opacity: 0,
    y: 20,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: sec,
      start: "top 85%"
    }
  });
});

// Navbar hide/show
const navbar = document.querySelector(".navbar");
let lastScroll = window.scrollY;

window.addEventListener("scroll", () => {
  const current = window.scrollY;

  gsap.to(navbar, {
    y: current > lastScroll && current > 100 ? -120 : 0,
    duration: 0.6,
    ease: "power3.out"
  });

  lastScroll = current;
});
