import { render } from '@testing-library/react'
import BackgroundRainParticles from '../BackgroundRainParticles'

describe('BackgroundRainParticles', () => {
  it('monta el canvas sin errores', () => {
    const { container } = render(<BackgroundRainParticles density={10} speed={0.5} />)
    const canvas = container.querySelector('canvas.login-particles-canvas')
    expect(canvas).toBeInTheDocument()
  })
})