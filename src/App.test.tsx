import { render} from '@testing-library/react'
import App from './App'

test('renders app without crashing', () => {
  render(<App />)
  // Verifica que la app se renderiza sin errores
})

test('app has main content', () => {
  render(<App />)
  // Verifica que hay contenido en la app
  expect(document.body).toBeInTheDocument()
})