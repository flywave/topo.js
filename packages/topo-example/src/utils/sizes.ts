import EventEmitter from "./event_emitter";

export default class Sizes extends EventEmitter {
  width: number
  height: number
  aspect: number
  pixelRatio: number
  canvas: HTMLCanvasElement



  constructor(canvas: HTMLCanvasElement) {
    super()
    this.canvas = canvas
    this.width = this.canvas.getBoundingClientRect().width
    this.height = this.canvas.getBoundingClientRect().height
    this.aspect = this.width / this.height
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)


    window.addEventListener("resize", () => {
      this.width = this.canvas.getBoundingClientRect().width
      this.height = this.canvas.getBoundingClientRect().height
      this.aspect = this.width / this.height
      this.pixelRatio = Math.min(window.devicePixelRatio, 2)
      this.trigger('resize')
    })
  }
}

