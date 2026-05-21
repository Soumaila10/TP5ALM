import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../../pages/ProfilePage';
import { useAuthStore } from '../../store/authStore';
import { updateProfile } from '../../services/userService';

jest.mock('../../services/userService', () => ({
  updateProfile: jest.fn(),
}));

describe('ProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        phone: '+33612345678',
        role: 'user',
      },
      accessToken: 'mock-access-token',
      isAuthenticated: true,
    });
  });

  test('renders user profile details', () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/prénom/i).value).toBe('Alice');
    expect(screen.getByLabelText(/^nom$/i).value).toBe('Smith');
    expect(screen.getByLabelText(/adresse email/i).value).toBe('alice@test.com');
    expect(screen.getByLabelText(/adresse email/i)).toBeDisabled();
    expect(screen.getByLabelText(/numéro de téléphone/i).value).toBe('+33612345678');
  });

  test('handles form submission successfully', async () => {
    updateProfile.mockResolvedValue({
      user: {
        firstName: 'Alice Updated',
        lastName: 'Smith Updated',
        email: 'alice@test.com',
        phone: '+33699999999',
        role: 'user',
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'Alice Updated' } });
    fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Smith Updated' } });
    fireEvent.change(screen.getByLabelText(/numéro de téléphone/i), { target: { value: '+33699999999' } });

    fireEvent.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        firstName: 'Alice Updated',
        lastName: 'Smith Updated',
        phone: '+33699999999',
      });
      expect(screen.getByText(/profil mis à jour avec succès/i)).toBeInTheDocument();
    });

    // Verify Zustand store updated
    expect(useAuthStore.getState().user.firstName).toBe('Alice Updated');
  });
});
