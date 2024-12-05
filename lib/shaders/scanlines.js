import * as THREE from "../three.module.js";

export const ScanlinesShader = {
  uniforms: {
    tDiffuse: { value: null },
    opacity: { value: 0.05 },
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float opacity;
        uniform vec2 resolution;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            vec4 color = texture2D(tDiffuse, uv);
            float scanline = sin(uv.y * resolution.y * 2.0) * 0.04;
            color.rgb += scanline;
            gl_FragColor = color;
        }
    `,
};
