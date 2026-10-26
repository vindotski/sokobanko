import {
  type ColorSource,
  Graphics,
  Particle,
  ParticleContainer,
  Rectangle,
  type Renderer,
  type Texture,
} from "pixi.js";

/**
 * How long a burst lasts, in milliseconds. The play page waits as long
 * before opening its dialog.
 */
export const CELEBRATION_MS = 900;

const PER_POINT = 24;
/** In board pixels (64 per tile) per second. */
const SPEED = { min: 150, max: 450 };
const GRAVITY = 900;
const RADIUS = 8;

interface Spark {
  particle: Particle;
  vx: number;
  vy: number;
  spin: number;
  size: number;
  life: number;
  age: number;
}

const between = (min: number, max: number) => min + Math.random() * (max - min);

/** Sparks that fly out of points on the board, fall and fade. */
export class Celebration {
  readonly view: ParticleContainer;
  private readonly texture: Texture;
  private sparks: Spark[] = [];

  constructor(renderer: Renderer) {
    // One white dot, tinted per spark.
    const dot = new Graphics().circle(RADIUS, RADIUS, RADIUS).fill(0xffffff);
    this.texture = renderer.generateTexture(dot);
    dot.destroy();
    this.view = new ParticleContainer({
      texture: this.texture,
      // Sparks can fly anywhere around the board.
      boundsArea: new Rectangle(-1e4, -1e4, 2e4, 2e4),
      dynamicProperties: {
        position: true,
        rotation: true,
        vertex: true,
        color: true,
      },
    });
  }

  /** Bursts from each point, in board coordinates. */
  burst(points: { x: number; y: number }[], colors: ColorSource[]) {
    for (const { x, y } of points) {
      for (let i = 0; i < PER_POINT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = between(SPEED.min, SPEED.max);
        const size = between(0.4, 1);
        const particle = new Particle({
          texture: this.texture,
          x,
          y,
          anchorX: 0.5,
          anchorY: 0.5,
          scaleX: size,
          scaleY: size,
          tint: colors[i % colors.length] ?? 0xffffff,
        });
        this.view.addParticle(particle);
        this.sparks.push({
          particle,
          vx: Math.cos(angle) * speed,
          // A little upward, so sparks arc before they fall.
          vy: Math.sin(angle) * speed - 200,
          spin: between(-8, 8),
          size,
          life: between(CELEBRATION_MS * 0.6, CELEBRATION_MS),
          age: 0,
        });
      }
    }
  }

  update(deltaMs: number) {
    if (!this.sparks.length) return;
    const dt = deltaMs / 1000;
    for (const spark of this.sparks) {
      spark.age += deltaMs;
      spark.vy += GRAVITY * dt;
      const { particle } = spark;
      particle.x += spark.vx * dt;
      particle.y += spark.vy * dt;
      particle.rotation += spark.spin * dt;
      const left = Math.max(1 - spark.age / spark.life, 0);
      particle.alpha = left;
      particle.scaleX = particle.scaleY = spark.size * (0.5 + left / 2);
    }
    if (this.sparks.every((s) => s.age < s.life)) return;
    this.sparks = this.sparks.filter((s) => s.age < s.life);
    const children = this.view.particleChildren;
    children.length = 0;
    children.push(...this.sparks.map((s) => s.particle));
    this.view.update();
  }

  clear() {
    if (!this.sparks.length) return;
    this.sparks = [];
    this.view.removeParticles();
  }

  destroy() {
    this.texture.destroy(true);
  }
}
