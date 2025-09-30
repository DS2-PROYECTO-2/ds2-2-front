import { render, act } from '@testing-library/react'
import BackgroundRainParticles from '../BackgroundRainParticles'

it('no falla al manejar window.resize', () => {
  const { container } = render(<BackgroundRainParticles density={5} speed={1} />)
  const canvas = container.querySelector('canvas.login-particles-canvas') as HTMLCanvasElement

  // mock layout (opcional)
  Object.defineProperty(canvas, 'offsetWidth',  { value: 500, configurable: true })
  Object.defineProperty(canvas, 'offsetHeight', { value: 300, configurable: true })

  // sólo verificamos que no tira error
  act(() => { window.dispatchEvent(new Event('resize')) })
  expect(canvas).toBeInTheDocument()
})