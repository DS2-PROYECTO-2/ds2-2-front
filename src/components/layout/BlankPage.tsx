import React from 'react';

interface BlankPageProps {
  title: string;
  description?: string;
}

const BlankPage: React.FC<BlankPageProps> = ({ title, description }) => {
  return (
    <div className="blank-page">
      <div className="blank-content">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        <div className="coming-soon">
          <p>Esta funcionalidad estará disponible próximamente.</p>
        </div>
      </div>
    </div>
  );
};

export default BlankPage;

