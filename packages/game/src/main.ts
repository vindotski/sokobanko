import { Application, Graphics } from "pixi.js";

const app = new Application();

await app.init({
  background: "#1099bb",
  resizeTo: window,
  antialias: true,
});

document.getElementById("app")?.appendChild(app.canvas);

const box = new Graphics().rect(-50, -50, 100, 100).fill(0xffffff);
box.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(box);

app.ticker.add((ticker) => {
  box.rotation += 0.02 * ticker.deltaTime;
  box.position.set(app.screen.width / 2, app.screen.height / 2);
});
