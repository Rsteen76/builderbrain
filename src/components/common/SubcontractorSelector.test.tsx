import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SubcontractorSelector from './SubcontractorSelector';
import { useAuth } from '../../contexts/AuthContext';
import { SubcontractorService } from '../../services/subcontractor';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/subcontractor', () => ({
  SubcontractorService: {
    getSubcontractors: jest.fn(),
    createSubcontractor: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedSubcontractorService = SubcontractorService as jest.Mocked<typeof SubcontractorService>;

describe('SubcontractorSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: { uid: 'user-1' } } as ReturnType<typeof useAuth>);
    mockedSubcontractorService.getSubcontractors.mockResolvedValue([
      {
        id: 'sub-1',
        name: 'Apex Concrete',
        specialty: 'Concrete',
      } as any,
      {
        id: 'sub-2',
        name: 'Frame Right',
        specialty: 'Framing',
      } as any,
    ]);
  });

  test('loads subcontractors and selects one', async () => {
    const onChange = jest.fn();

    render(<SubcontractorSelector value="" onChange={onChange} />);

    await waitFor(() => expect(mockedSubcontractorService.getSubcontractors).toHaveBeenCalledWith('user-1'));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /subcontractor/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'Apex Concrete' }));

    expect(onChange).toHaveBeenCalledWith('sub-1', 'Apex Concrete');
  });

  test('creates a new subcontractor from the inline form', async () => {
    const onChange = jest.fn();
    mockedSubcontractorService.createSubcontractor.mockResolvedValue({
      id: 'sub-new',
      name: 'New Drywall Co',
      specialty: '',
    } as any);

    render(<SubcontractorSelector value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add new subcontractor/i }));
    fireEvent.change(screen.getByLabelText(/new subcontractor name/i), {
      target: { value: 'New Drywall Co' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() =>
      expect(mockedSubcontractorService.createSubcontractor).toHaveBeenCalledWith('user-1', expect.objectContaining({
        name: 'New Drywall Co',
      }))
    );
    expect(onChange).toHaveBeenCalledWith('sub-new', 'New Drywall Co');
    expect(screen.queryByLabelText(/new subcontractor name/i)).not.toBeInTheDocument();
  });

  test('does not fetch or create without an authenticated user', async () => {
    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    render(<SubcontractorSelector value="" onChange={jest.fn()} />);

    await waitFor(() => expect(mockedSubcontractorService.getSubcontractors).not.toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /add new subcontractor/i }));
    fireEvent.change(screen.getByLabelText(/new subcontractor name/i), {
      target: { value: 'No User Sub' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(mockedSubcontractorService.createSubcontractor).not.toHaveBeenCalled();
  });
});
