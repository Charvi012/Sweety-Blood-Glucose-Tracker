import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ReportCard from '../src/components/ReportCard.jsx';

describe('<ReportCard />', () => {
  it('shows a friendly empty state when there are no readings', () => {
    render(
      <ReportCard
        title="Monthly"
        report={{ range: { from: '2026-09-01', to: '2026-09-30' }, summary: { count: 0, highest: null, lowest: null, average: null } }}
      />,
    );
    expect(screen.getByText('No readings in this period.')).toBeInTheDocument();
    expect(screen.getByText('1 Sep – 30 Sep 2026')).toBeInTheDocument();
  });

  it('shows highest, lowest, average to 1 decimal and the count', () => {
    render(
      <ReportCard
        title="Month to date"
        report={{ range: { from: '2026-10-01', to: '2026-10-15' }, summary: { count: 3, highest: 180, lowest: 100, average: 140 } }}
      />,
    );
    expect(screen.getByText('Highest').nextSibling).toHaveTextContent('180');
    expect(screen.getByText('Lowest').nextSibling).toHaveTextContent('100');
    expect(screen.getByText('Average').nextSibling).toHaveTextContent('140.0'); // always 1 decimal
    expect(screen.getByText('Readings').nextSibling).toHaveTextContent('3');
  });

  it('lists each reading with its slot on the daily report', () => {
    render(
      <ReportCard
        title="Daily"
        report={{
          range: { from: '2026-10-15', to: '2026-10-15' },
          summary: { count: 2, highest: 141, lowest: 100, average: 120.5 },
          readings: [
            { id: 'a', slotLabel: 'Morning (fasting)', value: 100 },
            { id: 'b', slotLabel: 'After dinner', value: 141 },
          ],
        }}
      />,
    );
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 readings
    expect(rows[1]).toHaveTextContent('Morning (fasting)');
    expect(rows[2]).toHaveTextContent('After dinner');
  });
});
