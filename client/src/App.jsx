import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Batches from './pages/Batches';
import PairCodes from './pages/PairCodes';
import Machines from './pages/Machines';
import Recipes from './pages/Recipes';
import Dryers from './pages/Dryers';
import Hydro from './pages/Hydro';
import BatchForm from './pages/BatchForm';
import BatchProcess from './pages/BatchProcess';
import ProcessingLog from './pages/ProcessingLog';
import SummaryReport from './pages/SummaryReport';
import DetailReport from './pages/DetailReport';
import EfficiencyReport from './pages/EfficiencyReport';
import MachineQueue from './pages/MachineQueue';
import DryerQueue from './pages/DryerQueue';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container-fluid py-4 px-4">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/pair-codes" element={<PairCodes />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/dryers" element={<Dryers />} />
          <Route path="/hydro" element={<Hydro />} />
          <Route path="/batch-form" element={<BatchForm />} />
          <Route path="/batch-process" element={<BatchProcess />} />
          <Route path="/processing-log" element={<ProcessingLog />} />
          <Route path="/summary-report" element={<SummaryReport />} />
          <Route path="/detail-report" element={<DetailReport />} />
          <Route path="/efficiency-report" element={<EfficiencyReport />} />
          <Route path="/machine-queue" element={<MachineQueue />} />
          <Route path="/dryer-queue" element={<DryerQueue />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
