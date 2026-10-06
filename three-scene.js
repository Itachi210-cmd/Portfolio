/* ============================================================
   three-scene.js  –  3D space / anime background for Sujal Kate's portfolio
   Uses Three.js r160+ (ES module via importmap)
   ============================================================ */

import * as THREE from 'three';

/* ---------- helpers ---------- */
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp  = (a, b, t) => a + (b - a) * t;

/* ---------- tunables (exported so script.js can tweak) ---------- */
export const CONFIG = {
    starCount:   isMobile ? 800  : 2200,
    petalCount:  isMobile ? 30   : 80,
    islandCount: 4,
    bloomEnabled: !isMobile,
    fogNear: 20,
    fogFar: 120,
    colors: {
        bg:     0x0d0b1a,
        pink:   0xe879a8,
        purple: 0x8b5cf6,
        cyan:   0x60d4f0,
        gold:   0xf5c842,
        sakura: 0xf9a8c9,
    },
    cameraPath: [
        // Each zone: { position, lookAt }  – interpolated via scroll
        { pos: [0, 2, 30],   look: [0, 0, 0]   },   // Hero
        { pos: [8, 0, 20],   look: [5, -1, 0]   },   // About
        { pos: [-6, 3, 12],  look: [-3, 2, -5]  },   // Skills
        { pos: [4, -2, 5],   look: [0, -1, -8]  },   // Projects
        { pos: [-5, 4, -2],  look: [0, 3, -10]  },   // Achievements
        { pos: [0, 0, -10],  look: [0, 0, -20]  },   // Contact
    ],
};

/* ---------- state ---------- */
let renderer, scene, camera, clock;
let stars, petals;
let islands = [];
let avatarCoin = null;
let mouseX = 0, mouseY = 0;
let scrollProgress = 0;   // 0-1 across full page
let animating = true;
let lowGraphics = false;

/* ---------- init ---------- */
export function initScene(canvas) {
    if (!canvas) return;

    clock = new THREE.Clock();

    /* renderer */
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(CONFIG.colors.bg, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    /* scene + fog */
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.018);

    /* camera */
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 2, 30);

    /* lights */
    const ambient = new THREE.AmbientLight(0x221833, 0.6);
    scene.add(ambient);

    const pinkLight = new THREE.PointLight(CONFIG.colors.pink, 2.5, 60);
    pinkLight.position.set(-10, 8, 15);
    scene.add(pinkLight);

    const purpleLight = new THREE.PointLight(CONFIG.colors.purple, 2.0, 60);
    purpleLight.position.set(12, -5, 5);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(CONFIG.colors.cyan, 1.8, 50);
    cyanLight.position.set(0, 10, -10);
    scene.add(cyanLight);

    const goldLight = new THREE.PointLight(CONFIG.colors.gold, 1.0, 40);
    goldLight.position.set(-8, -3, -15);
    scene.add(goldLight);

    /* create objects */
    createStars();
    createPetals();
    createIslands();
    createAvatarCoin();
    createGlowSprites();

    /* events */
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    if (window.DeviceOrientationEvent && isMobile) {
        window.addEventListener('deviceorientation', onGyro);
    }
    document.addEventListener('visibilitychange', () => {
        animating = !document.hidden;
        if (animating) clock.getDelta(); // reset delta
    });

    /* start */
    animate();
}

/* ================ STARS ================ */
function createStars() {
    const count = CONFIG.starCount;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const twinkles  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 160;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
        sizes[i] = Math.random() * 2.0 + 0.4;
        twinkles[i] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute('position',   new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize',      new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aTwinkle',   new THREE.BufferAttribute(twinkles, 1));

    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(0xffffff) },
            uColor2: { value: new THREE.Color(CONFIG.colors.pink) },
            uColor3: { value: new THREE.Color(CONFIG.colors.cyan) },
        },
        vertexShader: `
            attribute float aSize;
            attribute float aTwinkle;
            uniform float uTime;
            varying float vTwinkle;
            varying float vMix;
            void main(){
                vTwinkle = aTwinkle;
                vMix = fract(aTwinkle * 3.17);
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * (180.0 / -mvPos.z) * (0.6 + 0.4 * sin(uTime * 1.5 + aTwinkle * 6.28));
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: `
            uniform vec3 uColor1, uColor2, uColor3;
            varying float vTwinkle;
            varying float vMix;
            void main(){
                float d = length(gl_PointCoord - 0.5);
                if(d > 0.5) discard;
                float alpha = smoothstep(0.5, 0.1, d);
                vec3 col = mix(mix(uColor1, uColor2, vMix), uColor3, step(0.7, vMix));
                gl_FragColor = vec4(col, alpha * 0.85);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    stars = new THREE.Points(geo, mat);
    scene.add(stars);
}

/* ================ SAKURA PETALS ================ */
function createPetals() {
    const count = CONFIG.petalCount;
    const petalGeo = new THREE.PlaneGeometry(0.3, 0.18, 1, 1);
    const petalMat = new THREE.MeshBasicMaterial({
        color: CONFIG.colors.sakura,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    const mesh = new THREE.InstancedMesh(petalGeo, petalMat, count);
    const dummy = new THREE.Object3D();
    mesh.userData.offsets = [];

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 80;
        const y = Math.random() * 60 - 10;
        const z = (Math.random() - 0.5) * 80;
        dummy.position.set(x, y, z);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.scale.setScalar(0.8 + Math.random() * 1.2);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.userData.offsets.push({
            x, y, z,
            speedY: 0.3 + Math.random() * 0.5,
            speedRot: 0.5 + Math.random(),
            phase: Math.random() * Math.PI * 2,
        });
    }
    mesh.instanceMatrix.needsUpdate = true;
    petals = mesh;
    scene.add(mesh);
}

/* ================ FLOATING ISLANDS ================ */
function createIslands() {
    const configs = [
        { pos: [-15, 5, -20],  size: 3.0, color: CONFIG.colors.pink,   emissive: 0.4 },
        { pos: [18, -3, -30],  size: 2.5, color: CONFIG.colors.purple, emissive: 0.5 },
        { pos: [-8, -6, -40],  size: 4.0, color: CONFIG.colors.cyan,   emissive: 0.3 },
        { pos: [10, 8, -15],   size: 1.8, color: CONFIG.colors.gold,   emissive: 0.4 },
    ];

    configs.forEach((cfg, i) => {
        const geo = new THREE.IcosahedronGeometry(cfg.size, 1);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            emissive: cfg.color,
            emissiveIntensity: cfg.emissive,
            roughness: 0.6,
            metalness: 0.2,
            wireframe: false,
            flatShading: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...cfg.pos);
        mesh.userData.baseY = cfg.pos[1];
        mesh.userData.phase = i * 1.2;
        mesh.userData.rotSpeed = 0.1 + Math.random() * 0.15;

        // glow halo around each island
        const glowGeo = new THREE.IcosahedronGeometry(cfg.size * 1.35, 1);
        const glowMat = new THREE.MeshBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glow);

        scene.add(mesh);
        islands.push(mesh);
    });
}

/* ================ AVATAR COIN ================ */
function createAvatarCoin() {
    const loader = new THREE.TextureLoader();
    loader.load('photo.jpeg', (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        // Coin = cylinder
        const coinGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.3, 48);
        
        // Create materials for the coin
        const sideMat = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.gold,
            emissive: CONFIG.colors.gold,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.3,
        });
        const faceMat = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.3,
            roughness: 0.5,
        });
        const backMat = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.purple,
            emissive: CONFIG.colors.purple,
            emissiveIntensity: 0.3,
            metalness: 0.6,
            roughness: 0.4,
        });
        
        const coin = new THREE.Mesh(coinGeo, [sideMat, faceMat, backMat]);
        coin.rotation.x = Math.PI * 0.1;
        coin.position.set(20, 3, 10);

        // Glow ring
        const ringGeo = new THREE.TorusGeometry(2.5, 0.08, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: CONFIG.colors.gold,
            transparent: true,
            opacity: 0.4,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        coin.add(ring);

        scene.add(coin);
        avatarCoin = coin;
    }, undefined, () => {
        // fallback: just a glowing sphere
        const geo = new THREE.SphereGeometry(2, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.gold,
            emissive: CONFIG.colors.gold,
            emissiveIntensity: 0.4,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(20, 3, 10);
        scene.add(mesh);
        avatarCoin = mesh;
    });
}

/* ================ GLOW SPRITES (fake bloom) ================ */
function createGlowSprites() {
    const spriteMat = (color, opacity) => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        const c = new THREE.Color(color);
        grad.addColorStop(0, `rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},${opacity})`);
        grad.addColorStop(0.4, `rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},${opacity*0.3})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        const tex = new THREE.CanvasTexture(canvas);
        return new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    };

    const glows = [
        { pos: [-10, 8, 15],   color: CONFIG.colors.pink,   scale: 18, opacity: 0.25 },
        { pos: [12, -5, 5],    color: CONFIG.colors.purple, scale: 16, opacity: 0.2  },
        { pos: [0, 10, -10],   color: CONFIG.colors.cyan,   scale: 14, opacity: 0.2  },
        { pos: [-15, 5, -20],  color: CONFIG.colors.pink,   scale: 10, opacity: 0.15 },
        { pos: [18, -3, -30],  color: CONFIG.colors.purple, scale: 12, opacity: 0.15 },
    ];

    glows.forEach(g => {
        const sprite = new THREE.Sprite(spriteMat(g.color, g.opacity));
        sprite.position.set(...g.pos);
        sprite.scale.setScalar(g.scale);
        scene.add(sprite);
    });
}

/* ================ CAMERA PATH INTERPOLATION ================ */
function updateCamera(t) {
    const path = CONFIG.cameraPath;
    const segCount = path.length - 1;
    const rawIdx = t * segCount;
    const idx = Math.floor(clamp(rawIdx, 0, segCount - 0.001));
    const localT = clamp(rawIdx - idx, 0, 1);

    const a = path[idx];
    const b = path[Math.min(idx + 1, segCount)];

    // Smooth step
    const st = localT * localT * (3 - 2 * localT);

    const px = lerp(a.pos[0], b.pos[0], st);
    const py = lerp(a.pos[1], b.pos[1], st);
    const pz = lerp(a.pos[2], b.pos[2], st);

    const lx = lerp(a.look[0], b.look[0], st);
    const ly = lerp(a.look[1], b.look[1], st);
    const lz = lerp(a.look[2], b.look[2], st);

    // Mouse parallax offset
    const parallaxX = mouseX * 1.5;
    const parallaxY = mouseY * 1.0;

    camera.position.set(px + parallaxX, py + parallaxY, pz);
    camera.lookAt(lx, ly, lz);
}

/* ================ ANIMATION LOOP ================ */
function animate() {
    requestAnimationFrame(animate);
    if (!animating) return;

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    /* stars twinkle */
    if (stars) {
        stars.material.uniforms.uTime.value = elapsed;
        stars.rotation.y = elapsed * 0.005;
    }

    /* petals fall */
    if (petals && !lowGraphics) {
        const dummy = new THREE.Object3D();
        const offsets = petals.userData.offsets;
        for (let i = 0; i < offsets.length; i++) {
            const o = offsets[i];
            o.y -= o.speedY * delta;
            if (o.y < -15) o.y = 40 + Math.random() * 10;
            dummy.position.set(
                o.x + Math.sin(elapsed * 0.5 + o.phase) * 1.5,
                o.y,
                o.z + Math.cos(elapsed * 0.3 + o.phase) * 1.0
            );
            dummy.rotation.x = elapsed * o.speedRot;
            dummy.rotation.z = elapsed * o.speedRot * 0.7 + o.phase;
            dummy.scale.setScalar(0.8 + Math.sin(elapsed + o.phase) * 0.3);
            dummy.updateMatrix();
            petals.setMatrixAt(i, dummy.matrix);
        }
        petals.instanceMatrix.needsUpdate = true;
    }

    /* islands float + rotate */
    islands.forEach(island => {
        island.position.y = island.userData.baseY + Math.sin(elapsed * 0.4 + island.userData.phase) * 1.2;
        island.rotation.y += island.userData.rotSpeed * delta;
        island.rotation.x = Math.sin(elapsed * 0.2 + island.userData.phase) * 0.1;
    });

    /* avatar coin rotate */
    if (avatarCoin) {
        avatarCoin.rotation.y += 0.4 * delta;
        avatarCoin.position.y = 3 + Math.sin(elapsed * 0.6) * 0.8;
    }

    /* camera */
    updateCamera(scrollProgress);

    renderer.render(scene, camera);
}

/* ================ EVENTS ================ */
function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}

function onGyro(e) {
    if (e.gamma !== null) mouseX = clamp(e.gamma / 30, -1, 1);
    if (e.beta  !== null) mouseY = clamp((e.beta - 45) / 30, -1, 1);
}

/* ---------- public API ---------- */
export function setScrollProgress(p) {
    scrollProgress = clamp(p, 0, 1);
}

export function setLowGraphics(on) {
    lowGraphics = on;
    if (petals) petals.visible = !on;
    // Reduce star opacity in low graphics
    if (stars) {
        stars.material.transparent = true;
        stars.material.opacity = on ? 0.4 : 1;
    }
    // Hide island glow in low-graphics
    islands.forEach(island => {
        island.children.forEach(child => { child.visible = !on; });
    });
}

export function isWebGLAvailable() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
            (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
}
