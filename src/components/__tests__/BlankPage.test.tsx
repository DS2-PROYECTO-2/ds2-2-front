import { render, screen } from '@testing-library/react';
import BlankPage from '../layout/BlankPage';

describe('BlankPage', () => {
  it('renderiza el componente con título y descripción', () => {
    render(
      <BlankPage 
        title="Test Page" 
        description="This is a test page" 
      />
    );

    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('This is a test page')).toBeInTheDocument();
  });

  it('renderiza con mensaje por defecto si no se proporciona', () => {
    render(<BlankPage title="Test" />);

    expect(screen.getByText('Esta funcionalidad estará disponible próximamente.')).toBeInTheDocument();
  });
});
