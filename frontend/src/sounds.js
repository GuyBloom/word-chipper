let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function playChop() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const impact = now + 0.20  // timed to axe blade hitting the block

    // Subtle whoosh as axe swings (very light, fades into impact)
    const whooshLen = Math.floor(ac.sampleRate * 0.22)
    const whooshBuf = ac.createBuffer(1, whooshLen, ac.sampleRate)
    const wd = whooshBuf.getChannelData(0)
    for (let i = 0; i < whooshLen; i++) wd[i] = Math.random() * 2 - 1
    const whoosh = ac.createBufferSource()
    whoosh.buffer = whooshBuf
    const hpf = ac.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.value = 1200
    const wg = ac.createGain()
    wg.gain.setValueAtTime(0, now)
    wg.gain.linearRampToValueAtTime(0.12, now + 0.1)
    wg.gain.linearRampToValueAtTime(0, impact)
    whoosh.connect(hpf)
    hpf.connect(wg)
    wg.connect(ac.destination)
    whoosh.start(now)

    // Low woody thud at impact
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, impact)
    osc.frequency.exponentialRampToValueAtTime(38, impact + 0.2)
    const oscGain = ac.createGain()
    oscGain.gain.setValueAtTime(1.1, impact)
    oscGain.gain.exponentialRampToValueAtTime(0.001, impact + 0.2)
    osc.connect(oscGain)
    oscGain.connect(ac.destination)
    osc.start(impact)
    osc.stop(impact + 0.22)

    // Sharp crack at impact
    const bufLen = Math.floor(ac.sampleRate * 0.08)
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.012))
    }
    const noise = ac.createBufferSource()
    noise.buffer = buf
    const bpf = ac.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 2200
    bpf.Q.value = 0.7
    const ng = ac.createGain()
    ng.gain.setValueAtTime(2.0, impact)
    ng.gain.exponentialRampToValueAtTime(0.001, impact + 0.08)
    noise.connect(bpf)
    bpf.connect(ng)
    ng.connect(ac.destination)
    noise.start(impact)
  } catch {}
}

export function playWin() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    // Three ascending marimba-like notes: C4, G4, C5
    const notes = [261.6, 392, 523.2]
    notes.forEach((freq, i) => {
      const t = now + i * 0.13

      // Fundamental — warm woody tone
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const g = ac.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.55, t + 0.006)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.connect(g)
      g.connect(ac.destination)
      osc.start(t)
      osc.stop(t + 0.6)

      // Slightly inharmonic overtone gives it a wooden bar character
      const osc2 = ac.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = freq * 3.08
      const g2 = ac.createGain()
      g2.gain.setValueAtTime(0, t)
      g2.gain.linearRampToValueAtTime(0.18, t + 0.006)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc2.connect(g2)
      g2.connect(ac.destination)
      osc2.start(t)
      osc2.stop(t + 0.22)
    })
  } catch {}
}

export function playInvalid() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    // Rapid rattling — like shaking a box of wooden scraps
    const count = 9
    for (let i = 0; i < count; i++) {
      const t = now + i * 0.032 + Math.random() * 0.018
      const bufLen = Math.floor(ac.sampleRate * 0.022)
      const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let j = 0; j < bufLen; j++) {
        d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.005))
      }
      const src = ac.createBufferSource()
      src.buffer = buf
      const bpf = ac.createBiquadFilter()
      bpf.type = 'bandpass'
      bpf.frequency.value = 280 + Math.random() * 320
      bpf.Q.value = 2
      const g = ac.createGain()
      g.gain.setValueAtTime(0.35 + Math.random() * 0.25, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.022)
      src.connect(bpf)
      bpf.connect(g)
      g.connect(ac.destination)
      src.start(t)
    }
  } catch {}
}

export function playScramble() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    // Series of light woody clicks, spread over ~0.3s to match the FLIP animation
    const clicks = 5
    for (let i = 0; i < clicks; i++) {
      const t = now + i * 0.06 + Math.random() * 0.018
      const bufLen = Math.floor(ac.sampleRate * 0.03)
      const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let j = 0; j < bufLen; j++) {
        d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.007))
      }
      const src = ac.createBufferSource()
      src.buffer = buf
      const bpf = ac.createBiquadFilter()
      bpf.type = 'bandpass'
      bpf.frequency.value = 700 + Math.random() * 700
      bpf.Q.value = 2.5
      const g = ac.createGain()
      const vol = 0.5 + Math.random() * 0.35
      g.gain.setValueAtTime(vol, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
      src.connect(bpf)
      bpf.connect(g)
      g.connect(ac.destination)
      src.start(t)
    }
  } catch {}
}
