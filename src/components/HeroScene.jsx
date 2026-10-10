'use client';

import { useEffect, useRef } from 'react';

/**
 * HeroScene — a slow, breathing field of soft points, like a lawn moving
 * in a light breeze. Deliberately quiet: low contrast, slow time scale,
 * a gentle lean toward the pointer. Three.js is loaded on demand, so it
 * never blocks the first paint. It pauses whenever it's off-screen or
 * the tab is hidden, and draws a single still frame when the visitor
 * prefers reduced motion (OS setting or the site's own toggle).
 */
export default function HeroScene({ className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let disposed = false;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed) return;

      const reduceMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('a11y-reduce-motion');

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        return; // No WebGL — the hero still reads fine without the scene.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 3.2, 9.5);
      camera.lookAt(0, 0, -1.5);

      const COLS = 150;
      const ROWS = 70;
      const positions = new Float32Array(COLS * ROWS * 3);
      const seeds = new Float32Array(COLS * ROWS);
      let i = 0;
      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          positions[i * 3] = (c / (COLS - 1) - 0.5) * 26;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = (r / (ROWS - 1) - 0.5) * 14 - 2;
          seeds[i] = Math.random();
          i += 1;
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));

      const uniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uNear: { value: new THREE.Color('#2d6a4f') },
        uFar: { value: new THREE.Color('#9db3a6') },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform vec2 uPointer;
          uniform float uPixelRatio;
          attribute float seed;
          varying float vDepth;
          varying float vSeed;
          void main() {
            vec3 p = position;
            float t = uTime * 0.18;
            float w = sin(p.x * 0.32 + t * 1.3) * 0.34
                    + sin(p.z * 0.55 - t * 1.1) * 0.26
                    + sin((p.x + p.z) * 0.18 + t * 0.7) * 0.42;
            // the field leans very slightly toward the pointer
            float d = distance(p.xz, vec2(uPointer.x * 9.0, uPointer.y * 4.0 - 1.0));
            w += smoothstep(5.5, 0.0, d) * 0.35;
            p.y += w;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            vDepth = clamp((-mv.z - 4.0) / 14.0, 0.0, 1.0);
            vSeed = seed;
            gl_PointSize = (2.6 + seed * 1.6) * uPixelRatio * (7.5 / -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uNear;
          uniform vec3 uFar;
          varying float vDepth;
          varying float vSeed;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float r = length(uv);
            float alpha = smoothstep(0.5, 0.15, r);
            vec3 col = mix(uNear, uFar, vDepth);
            float fade = (1.0 - vDepth) * 0.75 + 0.12;
            gl_FragColor = vec4(col, alpha * fade * (0.55 + vSeed * 0.45));
          }
        `,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = mount;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      const target = new THREE.Vector2(0, 0);
      const onPointer = (e) => {
        const rect = mount.getBoundingClientRect();
        target.set(((e.clientX - rect.left) / rect.width) * 2 - 1, ((e.clientY - rect.top) / rect.height) * 2 - 1);
      };
      window.addEventListener('pointermove', onPointer, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
      io.observe(mount);

      let last = performance.now();
      let raf = 0;
      const frame = () => {
        raf = requestAnimationFrame(frame);
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!visible || document.hidden) return;
        if (reduceMotion()) {
          uniforms.uTime.value = 12;
        } else {
          uniforms.uTime.value += dt;
        }
        uniforms.uPointer.value.lerp(target, 0.03);
        camera.position.x = uniforms.uPointer.value.x * 0.35;
        camera.lookAt(0, 0, -1.5);
        renderer.render(scene, camera);
      };
      frame();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener('pointermove', onPointer);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
