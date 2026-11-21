import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from '../src/components/ReadingForm.jsx';
import { ApiError } from '../src/api/client.js';

const TODAY = '2025-10-15';

function setup(props = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  render(<ReadingForm today={TODAY} onSubmit={onSubmit} onCancel={() => {}} {...props} />);
  return { onSubmit, user: userEvent.setup() };
}

describe('<ReadingForm />', () => {
  it('shows "Please enter a glucose value." and does not submit when the value is empty', async () => {
    const { onSubmit, user } = setup();
    await user.selectOptions(screen.getByLabelText('Time slot'), 'after_lunch');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(await screen.findByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the range message for an out-of-range value', async () => {
    const { onSubmit, user } = setup();
    await user.selectOptions(screen.getByLabelText('Time slot'), 'after_lunch');
    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '30');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the value as a number once valid', async () => {
    const { onSubmit, user } = setup({ defaultDate: '2025-10-10' });
    await user.selectOptions(screen.getByLabelText('Time slot'), 'after_dinner');
    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '142');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(onSubmit).toHaveBeenCalledWith({ date: '2025-10-10', slot: 'after_dinner', value: 142 });
  });

  it('shows the server message next to the slot when it is a duplicate', async () => {
    const message = 'You already have an After lunch reading for this date.';
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, { error: { code: 'DUPLICATE_SLOT', message, fields: { slot: message } } }));
    const { user } = setup({ onSubmit });
    await user.selectOptions(screen.getByLabelText('Time slot'), 'after_lunch');
    await user.type(screen.getByLabelText('Glucose (mg/dl)'), '120');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText('Time slot')).toHaveAttribute('aria-invalid', 'true');
  });

  it('pre-fills the form when editing', () => {
    setup({ reading: { id: '1', date: '2025-10-10', slot: 'after_breakfast', value: 150 } });
    expect(screen.getByLabelText('Glucose (mg/dl)')).toHaveValue(150);
    expect(screen.getByLabelText('Time slot')).toHaveValue('after_breakfast');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});
