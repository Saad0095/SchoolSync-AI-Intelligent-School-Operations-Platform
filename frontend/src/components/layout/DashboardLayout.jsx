import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () =>
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch { /* ignore */ }
      return next;
    });

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  // Lock body scroll while the mobile sidebar drawer is open.
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', sidebarOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [sidebarOpen]);

  // Close the mobile sidebar when pressing Escape.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div
        className={`flex min-h-screen flex-col transition-[margin] duration-200 ease-out ${
          sidebarCollapsed ? 'ml-0 md:ml-[72px]' : 'ml-0 md:ml-64'
        }`}
      >
        <Navbar onToggle={() => setSidebarOpen((s) => !s)} />
        <main id="main-content" className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
