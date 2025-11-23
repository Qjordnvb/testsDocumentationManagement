/**
 * Bugs Summary Statistics Component
 */

interface SummaryStatsProps {
  total: number;
  open: number;
  testing: number;
  closed: number;
}

export const SummaryStats = ({ total, open, testing, closed }: SummaryStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600">Total Bugs</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600">Abiertos</h3>
        <p className="text-3xl font-bold text-red-600 mt-2">{open}</p>
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600">En Testing</h3>
        <p className="text-3xl font-bold text-yellow-600 mt-2">{testing}</p>
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600">Cerrados</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">{closed}</p>
      </div>
    </div>
  );
};
