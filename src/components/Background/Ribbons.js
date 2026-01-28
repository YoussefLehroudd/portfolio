import React, { useEffect, useMemo, useRef } from 'react';
import { Renderer, Transform, Vec3, Color, Polyline } from 'ogl';

const Ribbons = ({
  colors = ['#FC8EAC'],
  baseSpring = 0.03,
  baseFriction = 0.9,
  baseThickness = 30,
  offsetFactor = 0.05,
  maxAge = 500,
  pointCount = 50,
  speedMultiplier = 0.6,
  enableFade = false,
  enableShaderEffect = false,
  effectAmplitude = 2,
  backgroundColor = [0, 0, 0, 0]
}) => {
  const containerRef = useRef(null);

  const palette = useMemo(() => {
    if (Array.isArray(colors) && colors.length) return colors;
    if (typeof colors === 'string' && colors.trim()) return [colors];
    return ['#FC8EAC'];
  }, [colors]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    const gl = renderer.gl;
    if (Array.isArray(backgroundColor) && backgroundColor.length === 4) {
      gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
    } else {
      gl.clearColor(0, 0, 0, 0);
    }

    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.pointerEvents = 'none';
    container.appendChild(gl.canvas);

    const scene = new Transform();
    const lines = [];

    const vertex = `
      precision highp float;
      
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;
      
      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;
      uniform float uTime;
      uniform float uEnableShaderEffect;
      uniform float uEffectAmplitude;
      
      varying vec2 vUV;
      
      vec4 getPosition() {
          vec4 current = vec4(position, 1.0);
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
          vec2 nextScreen = next.xy * aspect;
          vec2 prevScreen = prev.xy * aspect;
          vec2 tangent = normalize(nextScreen - prevScreen);
          vec2 normal = vec2(-tangent.y, tangent.x);
          normal /= aspect;
          normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
          float dist = length(nextScreen - prevScreen);
          normal *= smoothstep(0.0, 0.02, dist);
          float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
          float pixelWidth = current.w * pixelWidthRatio;
          normal *= pixelWidth * uThickness;
          current.xy -= normal * side;
          if(uEnableShaderEffect > 0.5) {
            current.xy += normal * sin(uTime + current.x * 10.0) * uEffectAmplitude;
          }
          return current;
      }
      
      void main() {
          vUV = uv;
          gl_Position = getPosition();
      }
    `;

    const fragment = `
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uEnableFade;
      varying vec2 vUV;
      void main() {
          float fadeFactor = 1.0;
          if(uEnableFade > 0.5) {
              fadeFactor = 1.0 - smoothstep(0.0, 1.0, vUV.y);
          }
          gl_FragColor = vec4(uColor, uOpacity * fadeFactor);
      }
    `;

    const linesForCleanup = [];

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      lines.forEach(line => line.polyline.resize());
    };

    const center = (palette.length - 1) / 2;
    palette.forEach((color, index) => {
      const spring = baseSpring + (Math.random() - 0.5) * 0.05;
      const friction = baseFriction + (Math.random() - 0.5) * 0.05;
      const thickness = baseThickness + (Math.random() - 0.5) * 3;
      const mouseOffset = new Vec3(
        (index - center) * offsetFactor + (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.1,
        0
      );

      const line = {
        spring,
        friction,
        mouseVelocity: new Vec3(),
        mouseOffset
      };

      const points = [];
      for (let i = 0; i < pointCount; i++) {
        points.push(new Vec3());
      }
      line.points = points;

      line.polyline = new Polyline(gl, {
        points,
        vertex,
        fragment,
        uniforms: {
          uColor: { value: new Color(color) },
          uThickness: { value: thickness },
          uOpacity: { value: 1.0 },
          uTime: { value: 0.0 },
          uEnableShaderEffect: { value: enableShaderEffect ? 1.0 : 0.0 },
          uEffectAmplitude: { value: effectAmplitude },
          uEnableFade: { value: enableFade ? 1.0 : 0.0 }
        }
      });
      line.polyline.mesh.setParent(scene);
      lines.push(line);
      linesForCleanup.push(line);
    });

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener('resize', resize);

    const mouse = new Vec3();
    const mouseTarget = new Vec3();
    const tmp = new Vec3();
    let frameId;
    let lastTime = performance.now();

    const updateMouse = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.changedTouches && e.changedTouches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.changedTouches && e.changedTouches[0]?.clientY) ?? 0;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      mouseTarget.set((x / width) * 2 - 1, (y / height) * -2 + 1, 0);
    };

    // Use pointer events for unified handling and smooth, rAF-driven lerp in the loop
    const handlePointerMove = (e) => updateMouse(e);
    const handlePointerDown = (e) => updateMouse(e);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    const update = () => {
      frameId = requestAnimationFrame(update);
      const currentTime = performance.now();
      const dt = Math.min(32, currentTime - lastTime); // clamp to avoid huge jumps on tab switch
      lastTime = currentTime;

      // Smooth mouse to avoid jitter at high speeds
      mouse.lerp(mouseTarget, 0.18);

      lines.forEach(line => {
        const headTarget = tmp.copy(mouse).add(line.mouseOffset);
        line.points[0].set(headTarget.x, headTarget.y, headTarget.z);

        for (let i = 1; i < line.points.length; i++) {
          if (isFinite(maxAge) && maxAge > 0) {
            const segmentDelay = maxAge / Math.max(1, line.points.length - 1);
            const alpha = Math.min(1, (dt * speedMultiplier) / segmentDelay);
            line.points[i].lerp(line.points[i - 1], alpha);
          } else {
            line.points[i].lerp(line.points[i - 1], 0.9);
          }
        }

        if (line.polyline.mesh.program.uniforms.uTime) {
          line.polyline.mesh.program.uniforms.uTime.value = currentTime * 0.001;
        }
        line.polyline.updateGeometry();
      });

      renderer.render({ scene });
    };

    update();

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(frameId);

      linesForCleanup.forEach(line => {
        if (line.polyline?.mesh) {
          line.polyline.mesh.setParent(null);
        }
      });

      if (gl.canvas && gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
    };
  }, [
    palette,
    baseSpring,
    baseFriction,
    baseThickness,
    offsetFactor,
    maxAge,
    pointCount,
    speedMultiplier,
    enableFade,
    enableShaderEffect,
    effectAmplitude,
    backgroundColor
  ]);

  return <div ref={containerRef} className="relative w-full h-full" />;
};

export default Ribbons;
