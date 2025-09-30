import React from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import "../../styles/dashboard.css";


const DashboardLayout: React.FC = () => {
  return (
    <div className="dashboard-layout">
      <LeftSidebar />
      <main className="main-content">
        <div className="content-panel">
          {/* Contenido principal vacío por ahora */}
        </div>
      </main>
      <RightSidebar />
    </div>
  );
};

export default DashboardLayout;