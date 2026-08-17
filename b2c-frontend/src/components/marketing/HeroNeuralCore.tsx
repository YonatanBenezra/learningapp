'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/src/providers/ThemeProvider';
import { buildHeroNetwork } from './heroNeuralNetwork';
import { HeroNeuralFallback } from './HeroNeuralFallback';

const LIGHT = { core: '#007F8E', glow: '#009DAF', accent: '#F97316', ink: '#FFFFFF' };
const DARK = { core: '#22D3EE', glow: '#67E8F9', accent: '#FB923C', ink: '#0F172A' };
const CORE_LABEL = ['Bina', 'AI'] as const;

function createCoreLabel(ink: string) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const family = getComputedStyle(document.body).fontFamily || 'Outfit, sans-serif';
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 168px ${family}`;
  ctx.fillText(CORE_LABEL[0], size / 2, size / 2 - 92);
  ctx.font = `700 210px ${family}`;
  ctx.fillText(CORE_LABEL[1], size / 2, size / 2 + 108);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.92, 0.92, 1);
  sprite.renderOrder = 10;
  return { sprite, texture, material };
}

export function HeroNeuralCore() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);
  const dark = theme === 'dark';

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const palette = dark ? DARK : LIGHT;
    const disposables: THREE.Object3D[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFailed(true);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.set(0, 0.04, 5.1);

    const ambient = new THREE.AmbientLight(0xffffff, dark ? 0.32 : 0.48);
    const key = new THREE.PointLight(palette.core, dark ? 10 : 8, 14);
    key.position.set(2.6, 2.1, 3.2);
    const fill = new THREE.PointLight(palette.accent, dark ? 5 : 4, 12);
    fill.position.set(-2.8, -1.4, 2.2);
    scene.add(ambient, key, fill);
    disposables.push(ambient, key, fill);

    const group = new THREE.Group();
    group.scale.setScalar(1);
    scene.add(group);

    const coreGeo = new THREE.IcosahedronGeometry(0.78, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: palette.core,
      emissive: palette.core,
      emissiveIntensity: dark ? 0.38 : 0.22,
      roughness: 0.42,
      metalness: 0.12,
      transparent: true,
      opacity: 0.72,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    geometries.push(coreGeo);
    materials.push(coreMat);

    const textures: THREE.Texture[] = [];
    const label = createCoreLabel(palette.ink);
    if (label) {
      core.add(label.sprite);
      materials.push(label.material);
      textures.push(label.texture);
    }

    const shellGeo = new THREE.IcosahedronGeometry(1.14, 1);
    const shellMat = new THREE.MeshStandardMaterial({
      color: palette.core,
      wireframe: true,
      transparent: true,
      opacity: dark ? 0.34 : 0.22,
    });
    group.add(new THREE.Mesh(shellGeo, shellMat));
    geometries.push(shellGeo);
    materials.push(shellMat);

    const ringGeoA = new THREE.TorusGeometry(1.52, 0.008, 8, 96);
    const ringMatA = new THREE.MeshBasicMaterial({
      color: palette.core,
      transparent: true,
      opacity: dark ? 0.5 : 0.38,
    });
    const ringA = new THREE.Mesh(ringGeoA, ringMatA);
    ringA.rotation.set(Math.PI / 2.35, 0.18, 0.12);
    group.add(ringA);
    geometries.push(ringGeoA);
    materials.push(ringMatA);

    const ringGeoB = new THREE.TorusGeometry(1.86, 0.006, 8, 96);
    const ringMatB = new THREE.MeshBasicMaterial({
      color: palette.accent,
      transparent: true,
      opacity: dark ? 0.14 : 0.1,
    });
    const ringB = new THREE.Mesh(ringGeoB, ringMatB);
    ringB.rotation.set(Math.PI / 2.05, 0.42, -0.28);
    group.add(ringB);
    geometries.push(ringGeoB);
    materials.push(ringMatB);

    const network = buildHeroNetwork();
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(network.linkPositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: palette.core,
      transparent: true,
      opacity: dark ? 0.28 : 0.2,
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));
    geometries.push(lineGeo);
    materials.push(lineMat);

    const nodeGeo = new THREE.SphereGeometry(0.038, 10, 10);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: palette.glow,
      emissive: palette.glow,
      emissiveIntensity: dark ? 0.7 : 0.45,
      roughness: 0.32,
      metalness: 0.12,
    });
    const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, network.nodes.length);
    const dummy = new THREE.Object3D();
    network.nodes.forEach((node, index) => {
      dummy.position.set(node.x, node.y, node.z);
      dummy.scale.setScalar(index % 7 === 0 ? 1.45 : 1);
      dummy.updateMatrix();
      nodes.setMatrixAt(index, dummy.matrix);
    });
    nodes.instanceMatrix.needsUpdate = true;
    group.add(nodes);
    geometries.push(nodeGeo);
    materials.push(nodeMat);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointer.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.ty = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    let visible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.08 },
    );
    observer.observe(wrap);

    const resize = () => {
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;

      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      pointer.x += (pointer.tx - pointer.x) * 0.032;
      pointer.y += (pointer.ty - pointer.y) * 0.032;

      group.rotation.y += delta * 0.095;
      group.rotation.x = pointer.y * 0.16;
      group.rotation.z = pointer.x * 0.06;
      group.position.y = Math.sin(elapsed * 0.65) * 0.05;

      coreMat.emissiveIntensity = (dark ? 0.38 : 0.22) * (1 + Math.sin(elapsed * 0.8) * 0.08);

      renderer.render(scene, camera);
    };

    wrap.addEventListener('pointermove', onPointerMove);
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      wrap.removeEventListener('pointermove', onPointerMove);
      disposables.forEach((object) => object.removeFromParent());
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === wrap) {
        wrap.removeChild(renderer.domElement);
      }
    };
  }, [dark]);

  if (failed) return <HeroNeuralFallback />;

  return <div ref={wrapRef} className="absolute inset-0" />;
}
