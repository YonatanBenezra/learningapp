"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type StarfieldCanvasProps = {
  className?: string;
  particleCount?: number;
};

/** Minimal Three.js background for hero sections (optional). */
export function StarfieldCanvas({
  className,
  particleCount = 1200,
}: StarfieldCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      host.clientWidth / host.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 1) {
      positions[i] = (Math.random() - 0.5) * 6;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x2dd4bf,
      size: 0.012,
      transparent: true,
      opacity: 0.65,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += 1;
      points.rotation.y = frame * 0.0004;
      points.rotation.x = frame * 0.00015;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!host) {
        return;
      }
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [particleCount]);

  return (
    <div
      ref={hostRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    />
  );
}
