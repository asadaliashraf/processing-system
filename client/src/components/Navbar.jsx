import { NavLink } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const link = (to, label, icon) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'nav-link px-3 py-1 rounded ' + (isActive ? 'active fw-semibold' : '')
      }
      onClick={() => setOpen(false)}
    >
      <i className={`bi bi-${icon} me-1`}></i>{label}
    </NavLink>
  );

  return (
    <nav className="navbar navbar-expand-lg" style={{ background: '#1a3a5c' }}>
      <div className="container-fluid px-4">
        <span className="navbar-brand text-white fw-bold fs-5">
          <i className="bi bi-gear-fill me-2"></i>Processing System
        </span>
        <button className="navbar-toggler bg-white" onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto gap-1 mt-2 mt-lg-0">
            <li className="nav-item">{link('/dashboard', 'Dashboard', 'speedometer2')}</li>

            <li className="nav-item dropdown">
              <span className="nav-link dropdown-toggle text-white px-3 py-1" role="button"
                data-bs-toggle="dropdown">
                <i className="bi bi-database me-1"></i>Master Data
              </span>
              <ul className="dropdown-menu">
                <li><NavLink to="/batches" className="dropdown-item">Batches</NavLink></li>
                <li><NavLink to="/pair-codes" className="dropdown-item">Pair Codes</NavLink></li>
                <li><NavLink to="/machines" className="dropdown-item">Machines</NavLink></li>
                <li><NavLink to="/recipes" className="dropdown-item">Recipes</NavLink></li>
                <li><NavLink to="/dryers" className="dropdown-item">Dryers</NavLink></li>
                <li><NavLink to="/hydro" className="dropdown-item">Hydro</NavLink></li>
              </ul>
            </li>

            <li className="nav-item">{link('/batch-form', 'Batch Form', 'ui-checks-grid')}</li>
            <li className="nav-item">{link('/batch-process', 'Process Tracking', 'diagram-3')}</li>

            <li className="nav-item dropdown">
              <span className="nav-link dropdown-toggle text-white px-3 py-1" role="button"
                data-bs-toggle="dropdown">
                <i className="bi bi-bar-chart me-1"></i>Reports
              </span>
              <ul className="dropdown-menu">
                <li><NavLink to="/processing-log" className="dropdown-item">Processing Log</NavLink></li>
                <li><NavLink to="/summary-report" className="dropdown-item">Summary Report</NavLink></li>
                <li><NavLink to="/detail-report" className="dropdown-item">Detail Report</NavLink></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <span className="nav-link dropdown-toggle text-white px-3 py-1" role="button"
                data-bs-toggle="dropdown">
                <i className="bi bi-activity me-1"></i>Queues
              </span>
              <ul className="dropdown-menu">
                <li><NavLink to="/machine-queue" className="dropdown-item">Machine Queue</NavLink></li>
                <li><NavLink to="/dryer-queue" className="dropdown-item">Dryer / Hydro Queue</NavLink></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        .navbar .nav-link { color: rgba(255,255,255,0.85) !important; }
        .navbar .nav-link:hover, .navbar .nav-link.active { color: #fff !important; background: rgba(255,255,255,0.15); }
        .navbar .dropdown-toggle { cursor: pointer; }
      `}</style>

    </nav>
  );
}
