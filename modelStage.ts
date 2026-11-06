import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const FILL = 0x222222
const LINE = 0x8a8a8a
// What lines and faces reach at the centre of the torch. Lines go past white so the
// tone mapping cannot pull them back to grey.
const LIT_LINE = new THREE.Color(1, 1, 1).multiplyScalar(3)
const LIT_FILL = 0x5c5c5c
// A piece singled out, such as the selected one, is filled with ACCENT and lined in
// ACCENT_LINE, both past tone mapping so the brand colour shows exact; the torch lifts the fill to ACCENT_LIT.
const ACCENT = 0x0056ff
const ACCENT_LINE = 0x00308f
const ACCENT_LIT = 0x4d88ff
// Torch radius and glyph size in model units, so the torch keeps its size against the
// model however large it is drawn; each held within CSS px bounds so it stays legible.
const REACH = { units: 2.4, min: 48, max: 160 }
const CELL = { units: 0.1, min: 3, max: 6 }
// Band of glyphs run across a newly shown model: its half width in CSS px, seconds to
// cross, and how bright it gets at its centre, from 0 to 1.
const SWEEP = { width: 160, length: 1.4, peak: 0.55 }
// Characters the torch writes with, sparsest first.
const GLYPHS = ' .:-=+*#%@'
// Share of the camera's distance to the model at which the torch's lamp sits, along the pointer's ray.
const LAMP = 0.7
// Rate the torch fades on its target power, and closes on the pointer: quick, with a trace of drag. Per second.
const FADE = 8
const TRACK = 14
// Wiggle: peak roll in radians, shakes per second, decay per second, length in seconds.
const WIGGLE = { amp: 0.07, freq: 6, decay: 7, length: 0.8 }

// Roll of a wiggle, seconds after it started.
export function wiggle(seconds: number) {
  if (seconds < 0 || seconds >= WIGGLE.length) return 0
  return WIGGLE.amp * Math.sin(seconds * WIGGLE.freq * 2 * Math.PI) * Math.exp(-seconds * WIGGLE.decay)
}
// Connector face on, a little above and to its left.
export const VIEW = new THREE.Vector3(-0.2, 0.45, 1).normalize()
const MARGIN = 1.2
// Faces whose material is not the opaque body; edges and the rest get theirs by type.
const ACRYLIC = 'lid-faces'
const BASE = 'base-faces'
const OUTLINE = 'knob-outline'

// One fetch and parse per page however many viewers show the model; each clones it,
// so the shared geometry is never disposed.
const models = new Map<string, Promise<THREE.Group>>()
export function loadModel(src: string) {
  let model = models.get(src)
  if (!model) {
    model = new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .loadAsync(src)
      .then((gltf) => gltf.scene)
    models.set(src, model)
  }
  return model.then((scene) => scene.clone())
}

// Pushes the hull out a fixed pixel width along its normals, so smooth parts with
// no crease past the edge threshold still get a contour.
const outlineVertex = /* glsl */ `
  uniform vec2 resolution;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec2 dir = normalize((projectionMatrix * vec4(normalMatrix * normal, 0.0)).xy);
    clip.xy += dir * 2.0 / resolution * clip.w;
    gl_Position = clip;
  }
`
// A torch around a point on screen. Lines glow, with a faint lift everywhere so every
// edge answers while it is lit; faces change only under the torch's glyphs. Faces are shaded as ASCII art: a lamp at
// torchSource (view space) lights each face by how squarely it faces the lamp, plus a
// sharp highlight where it reflects the lamp towards the camera, so the glyphs follow
// the form instead of stamping over it. The screen is a grid of torchCell px squares
// whose glyph, from the atlas, is picked by that light and jittered at 12 fps; a face
// lights only where its glyph has ink. Normals come from screen derivatives, since the
// faces are flat. The frame count wraps so the hash input stays small for mediump floats.
const torch = /* glsl */ `
  uniform vec3 litColor;
  uniform vec2 torch;
  uniform float torchRadius;
  uniform float torchPower;
  uniform vec2 torchSweep;
  float torchBand() {
    float edge = 1.0 - smoothstep(0.0, torchSweep.y, abs(gl_FragCoord.x - torchSweep.x));
    return ${SWEEP.peak} * edge * edge;
  }
  #ifdef TORCH_LINE
  float torchLight() {
    float near = 1.0 - smoothstep(0.0, torchRadius, distance(gl_FragCoord.xy, torch));
    return max(torchPower * (0.2 + 0.8 * near), 0.8 * torchBand());
  }
  #else
  uniform float torchCell;
  uniform float torchTime;
  uniform sampler2D torchGlyphs;
  uniform vec3 torchSource;
  varying vec3 vTorchView;
  float torchLight() {
    vec2 at = gl_FragCoord.xy / torchCell;
    vec2 cell = floor(at);
    float near = 1.0 - smoothstep(0.0, torchRadius, distance((cell + 0.5) * torchCell, torch));
    vec3 n = normalize(cross(dFdx(vTorchView), dFdy(vTorchView)));
    vec3 v = normalize(-vTorchView);
    if (dot(n, v) < 0.0) n = -n;
    vec3 l = normalize(torchSource - vTorchView);
    float diffuse = max(dot(n, l), 0.0);
    float shine = pow(max(dot(n, normalize(l + v)), 0.0), 24.0);
    float band = torchBand();
    float light = max(torchPower * near * (0.55 * diffuse + 0.9 * shine), band * (0.35 + 0.65 * max(dot(n, v), 0.0)));
    vec2 seed = cell + mod(floor(torchTime * 12.0), 61.0) * vec2(7.0, 13.0);
    float jitter = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
    float glyph = floor(clamp(light + (jitter - 0.5) * 0.12, 0.0, 0.999) * ${GLYPHS.length}.0);
    float ink = texture2D(torchGlyphs, vec2((glyph + fract(at.x)) / ${GLYPHS.length}.0, fract(at.y))).r;
    return clamp(ink * (0.5 + 0.8 * light) * max(torchPower * near, band), 0.0, 1.0);
  }
  #endif
`

// One row of GLYPHS, white on black, a square each.
function glyphAtlas() {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size * GLYPHS.length
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.font = `${size * 0.8}px ui-monospace, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < GLYPHS.length; i++) ctx.fillText(GLYPHS[i], size * (i + 0.5), size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  return texture
}
const outlineFragment = /* glsl */ `
  #define TORCH_LINE
  uniform vec3 color;
  ${torch}
  void main() {
    gl_FragColor = vec4(mix(color, litColor, torchLight()), 1.0);
    #include <colorspace_fragment>
  }
`

// Model units between neighbours in a row of pieces, unless the caller asks for more.
const GAP = 1.5
// Dead on, level with the row: with each piece turned by facing, every one is in exact profile.
export const FRONT = new THREE.Vector3(0, 0, 1)

// Turn about y that points the front of a piece x along the row at a camera dist away
// on FRONT, undoing the perspective that would show the far pieces' sides.
export function facing(x: number, dist: number) {
  return Math.atan2(-x, dist)
}

// Lays pieces (groups of node names) side by side along x in the given order, each
// centred on the row's axis. x is a piece's centre in the row, mid its centre in the
// model; obj must have up to date world matrices and no parent.
export function layRow(obj: THREE.Object3D, pieces: string[][], gap = GAP) {
  let width = -gap
  let height = 0
  const row = pieces.map((names) => {
    const nodes = names.map((name) => obj.getObjectByName(name)).filter((n): n is THREE.Object3D => !!n)
    const box = new THREE.Box3()
    for (const node of nodes) box.expandByObject(node)
    const size = box.getSize(new THREE.Vector3())
    width += size.x + gap
    height = Math.max(height, size.y)
    return { nodes, mid: box.getCenter(new THREE.Vector3()), size, across: size.x, x: 0 }
  })
  let x = -width / 2
  for (const piece of row) {
    piece.x = x + piece.across / 2
    x += piece.across + gap
  }
  return { row, width: Math.max(0, width), height }
}

export type Stage = ReturnType<typeof createStage>

// GLB from scripts/obj-to-glb.mjs drawn unlit: flat near-black faces, grey baked
// edges, a see-through acrylic lid, a darker see-through base and an outlined knob on
// a transparent canvas, seen from VIEW around a pivot at the origin. tilt holds the
// pivot, so a roll on it stays in screen space while the pivot spins. A torch lights
// the model around the pointer while hover is on.
// fov: vertical, in degrees. A long thin frame wants it narrow, or the camera comes so
// close that pieces towards its ends are seen turned.
export function createStage(mount: HTMLElement, fov = 35) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 1000)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  // The tone mapping react-three-fiber applies by default; the greys are tuned through it.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  mount.appendChild(renderer.domElement)

  const lamp = {
    torch: { value: new THREE.Vector2() },
    torchRadius: { value: 0 },
    torchCell: { value: 0 },
    torchTime: { value: 0 },
    torchGlyphs: { value: glyphAtlas() },
    torchSource: { value: new THREE.Vector3() },
    // x: centre of the sweep band in device px, y: its half width; parked off screen at rest.
    torchSweep: { value: new THREE.Vector2(-1e5, 1) },
  }
  // Lit follows the hover; dark never lights, for pieces the torch should pass over.
  const power = { lit: { value: 0 }, dark: { value: 0 } }
  const litLine = { value: LIT_LINE }
  const litFill = { value: new THREE.Color(LIT_FILL) }
  const litAccent = { value: new THREE.Color(ACCENT_LIT) }
  const resolution = { value: new THREE.Vector2() }
  const withTorch = <T extends THREE.Material>(material: T, litColor: { value: THREE.Color }, torchPower: { value: number }) => {
    const line = material instanceof THREE.LineBasicMaterial
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, lamp, { litColor, torchPower })
      if (!line) {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vTorchView;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvTorchView = mvPosition.xyz;')
      }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${line ? '#define TORCH_LINE\n' : ''}${torch}`)
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( mix( diffuse, litColor, torchLight() ), opacity );')
    }
    return material
  }
  // Offset keeps coplanar edges winning the depth test instead of flickering.
  const offset = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }
  const materials = (accent: boolean, torchPower: { value: number }) => {
    const line = accent ? ACCENT_LINE : LINE
    const fill = { ...offset, color: accent ? ACCENT : FILL, toneMapped: !accent }
    const lift = accent ? litAccent : litFill
    return {
      body: withTorch(new THREE.MeshBasicMaterial(fill), lift, torchPower),
      acrylic: withTorch(new THREE.MeshBasicMaterial({ ...fill, transparent: true, opacity: 0.6, depthWrite: false }), lift, torchPower),
      base: withTorch(new THREE.MeshBasicMaterial({ ...fill, transparent: true, opacity: 0.85, depthWrite: false }), lift, torchPower),
      edge: withTorch(new THREE.LineBasicMaterial({ color: line, toneMapped: !accent }), litLine, torchPower),
      outline: new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(line) }, resolution, ...lamp, litColor: litLine, torchPower },
        vertexShader: outlineVertex,
        fragmentShader: outlineFragment,
        side: THREE.BackSide,
      }),
    }
  }
  const sets = new Map<string, ReturnType<typeof materials>>()
  const set = (accent: boolean, lit: boolean) => {
    const key = `${accent}${lit}`
    let found = sets.get(key)
    if (!found) {
      found = materials(accent, lit ? power.lit : power.dark)
      sets.set(key, found)
    }
    return found
  }

  const tilt = new THREE.Group()
  const pivot = new THREE.Group()
  scene.add(tilt)
  tilt.add(pivot)
  const tan = Math.tan((Math.PI * camera.fov) / 360)

  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const pointer = new THREE.Vector2()
  const torchAt = new THREE.Vector2()
  let lighting = false
  let sweptAt = -Infinity

  let frame = 0
  let last = 0
  let step: (dt: number, now: number) => void = () => {}
  const tick = (now: number) => {
    const dt = (now - last) / 1000
    last = now
    const k = still ? 1 : 1 - Math.exp(-dt * FADE)
    const on = power.lit.value + ((lighting ? 1 : 0) - power.lit.value) * k
    // A torch switched on from dark starts under the pointer instead of sliding over from where it went out.
    if (on < 0.01 || still) torchAt.copy(pointer)
    else torchAt.lerp(pointer, 1 - Math.exp(-dt * TRACK))
    const ratio = renderer.getPixelRatio()
    lamp.torch.value.set(torchAt.x * ratio, (mount.clientHeight - torchAt.y) * ratio)
    if (!still) lamp.torchTime.value = now / 1000
    power.lit.value = on
    step(dt, now)
    const unit = mount.clientHeight / (2 * camera.position.length() * tan)
    const px = ({ units, min, max }: typeof CELL) => THREE.MathUtils.clamp(units * unit, min, max) * ratio
    lamp.torchRadius.value = px(REACH)
    lamp.torchCell.value = px(CELL)
    const swept = (now - sweptAt) / 1000 / SWEEP.length
    const band = SWEEP.width * ratio
    const across = mount.clientWidth * ratio + 2 * band
    // Eased in and out, entering and leaving fully off the canvas.
    lamp.torchSweep.value.set(swept < 1 ? -band + across * (swept * swept * (3 - 2 * swept)) : -1e5, band)
    // The lamp sits on the ray through the torch, between the camera and the model's centre.
    camera.updateMatrixWorld()
    lamp.torchSource.value
      .set((torchAt.x / mount.clientWidth) * 2 - 1, -(torchAt.y / mount.clientHeight) * 2 + 1, 0.5)
      .unproject(camera)
      .applyMatrix4(camera.matrixWorldInverse)
      .normalize()
      .multiplyScalar(camera.position.length() * LAMP)
    renderer.getDrawingBufferSize(resolution.value)
    renderer.render(scene, camera)
    frame = requestAnimationFrame(tick)
  }
  // Draws only while on screen.
  const io = new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(frame)
    if (entry.isIntersecting) {
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
  })

  return {
    camera,
    tilt,
    pivot,
    still,
    // Runs each frame before the draw, from now on and while the mount is on screen.
    start(fn: (dt: number, now: number) => void) {
      step = fn
      io.observe(mount)
    },
    // Points the torch and the returned ray at the event's position.
    aim(e: MouseEvent) {
      const rect = mount.getBoundingClientRect()
      pointer.set(e.clientX - rect.left, e.clientY - rect.top)
      ndc.set((pointer.x / rect.width) * 2 - 1, -(pointer.y / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      return raycaster
    },
    hover(on: boolean) {
      lighting = on
    },
    // Runs a band of glyphs across the model once, left to right.
    sweep() {
      if (!still) sweptAt = performance.now()
    },
    // accent: drawn in ACCENT instead of grey. lit: false keeps the torch off this object.
    paint(obj: THREE.Object3D, { accent = false, lit = true } = {}) {
      const { body, acrylic, base, edge, outline } = set(accent, lit)
      obj.traverse((node) => {
        if (node instanceof THREE.LineSegments) node.material = edge
        else if (node instanceof THREE.Mesh) {
          node.material = node.name === ACRYLIC ? acrylic : node.name === BASE ? base : node.name === OUTLINE ? outline : body
        }
      })
    },
    // False until the mount has a size to draw at.
    resize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (!w || !h) return false
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      return true
    },
    // drei <Bounds fit>: a longest side of size fits the narrower frame axis, then the margin.
    fitDistance(size: number) {
      const fitHeight = size / (2 * Math.atan((Math.PI * camera.fov) / 360))
      return MARGIN * Math.max(fitHeight, fitHeight / camera.aspect)
    },
    // Distance at which a width by height span fits the frame, then the margin.
    spanDistance(width: number, height: number) {
      return (MARGIN * Math.max(height, width / camera.aspect)) / (2 * tan)
    },
    // view: unit direction from the origin to the camera.
    place(dist: number, view = VIEW) {
      camera.position.copy(view).multiplyScalar(dist)
      camera.lookAt(0, 0, 0)
    },
    dispose() {
      cancelAnimationFrame(frame)
      io.disconnect()
      for (const materials of sets.values()) for (const material of Object.values(materials)) material.dispose()
      lamp.torchGlyphs.value.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
