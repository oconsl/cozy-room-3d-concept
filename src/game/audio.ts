export class CozyAudio {
  private audio = new Audio("/assets/sounds/sunday.wav");
  constructor() {
    this.audio.loop = true;
    this.audio.volume = 0.25;
  }
  async play() {
    try {
      await this.audio.play();
      return true;
    } catch {
      return false;
    }
  }
  stop() {
    this.audio.pause();
  }
  volume(v: number) {
    this.audio.volume = v;
  }
  destroy() {
    this.stop();
    this.audio.removeAttribute("src");
    this.audio.load();
  }
}
