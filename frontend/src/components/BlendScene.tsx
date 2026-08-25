import { useEffect, useRef } from "react";
import * as THREE from "three";

interface BlendSceneProps {
  className?: string;
}

export const BlendScene = ({ className = "" }: BlendSceneProps) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const redGeometry = new THREE.TorusKnotGeometry(1.18, 0.3, 220, 32, 2, 3);
    const redMaterial = new THREE.MeshPhysicalMaterial({ color: 0xef6859, roughness: 0.32, metalness: 0.12, clearcoat: 0.7, clearcoatRoughness: 0.28 });
    const redOrb = new THREE.Mesh(redGeometry, redMaterial);
    redOrb.position.x = -0.48;
    redOrb.scale.setScalar(1.05);
    group.add(redOrb);

    const inkGeometry = new THREE.TorusKnotGeometry(1.04, 0.26, 210, 30, 3, 2);
    const inkMaterial = new THREE.MeshPhysicalMaterial({ color: 0x7182de, roughness: 0.3, metalness: 0.18, clearcoat: 0.82, clearcoatRoughness: 0.22 });
    const inkOrb = new THREE.Mesh(inkGeometry, inkMaterial);
    inkOrb.position.x = 0.58;
    inkOrb.rotation.x = 0.9;
    group.add(inkOrb);

    const ringGeometry = new THREE.TorusGeometry(1.9, 0.012, 12, 180);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xd9dce8, transparent: true, opacity: 0.2 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = 1.2;
    ring.rotation.y = 0.38;
    group.add(ring);

    scene.add(new THREE.HemisphereLight(0xf8f5ee, 0x11131e, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 4.5);
    key.position.set(3, 5, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0x6679df, 15, 16);
    rim.position.set(-4, -2, 3);
    scene.add(rim);

    const pointer = new THREE.Vector2();
    const target = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      target.set(
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.75,
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.5,
      );
    };
    host.addEventListener("pointermove", onPointerMove, { passive: true });

    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.05 });
    visibilityObserver.observe(host);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let frame = 0;
    const clock = new THREE.Clock();
    const render = () => {
      frame = requestAnimationFrame(render);
      if (!visible) return;

      const time = clock.getElapsedTime();
      pointer.lerp(target, 0.045);
      group.rotation.y = pointer.x + (reducedMotion ? 0 : Math.sin(time * 0.22) * 0.12);
      group.rotation.x = -pointer.y + 0.08;
      redOrb.rotation.y = reducedMotion ? 0.2 : time * 0.1;
      inkOrb.rotation.y = reducedMotion ? -0.2 : -time * 0.085;
      redOrb.position.y = reducedMotion ? 0 : Math.sin(time * 0.7) * 0.06;
      inkOrb.position.y = reducedMotion ? 0 : Math.cos(time * 0.62) * 0.06;
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onPointerMove);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      redGeometry.dispose();
      redMaterial.dispose();
      inkGeometry.dispose();
      inkMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
};
