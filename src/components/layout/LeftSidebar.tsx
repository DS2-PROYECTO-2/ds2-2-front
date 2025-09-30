import React, { useState } from 'react';
import { 
  Home, 
  ShoppingCart, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const LeftSidebar: React.FC = () => {
  const [activeButton, setActiveButton] = useState(0);

  const buttons = [
    { icon: Home, id: 0 },
    { icon: ShoppingCart, id: 1 },
    { icon: BarChart3, id: 2 },
    { icon: Settings, id: 3 }
  ];

  return (
    <aside className="left-sidebar">
      <div className="sidebar-logo">AnicornApp</div>
      <nav className="sidebar-nav">
        {buttons.map(({ icon: Icon, id }) => (
          <button
            key={id}
            className={`sidebar-button ${activeButton === id ? 'active' : ''}`}
            onClick={() => setActiveButton(id)}
            title={`Botón ${id + 1}`}
          >
            <Icon size={24} />
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default LeftSidebar;