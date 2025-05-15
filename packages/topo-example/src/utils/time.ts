import EventEmitter from "./event_emitter";

class Time extends EventEmitter {
  current: number
  start: number
  elapsed: number
  deltaTime: number


  constructor() {
    super()
    this.current = Date.now()
    this.start = this.current
    this.elapsed = 0
    this.deltaTime = 16

    this.tick()
  }

  tick = () => {
    const currentTime = Date.now()
    this.deltaTime = currentTime - this.current
    this.elapsed = currentTime - this.start
    this.trigger('tick')

    window.requestAnimationFrame(() => {
      this.tick()
    })
  }
}


export default Time
