import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthCallbackPage from '../../pages/AuthCallbackPage';
import { useAuthStore } from '../../store/authStore';
import { getProfile } from '../../services/userService';
import { setAccessToken } from '../../services/api';

jest.mock('../../services/userService', () => ({
  getProfile: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  setAccessToken: jest.fn(),
}));

// Mock component to check routing redirection destination
const DummyComponent = ({ name }) => <div data-testid={name}>{name}</div>;

describe('AuthCallbackPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: '',
      isAuthenticated: false,
    });
  });

  test('successfully authenticated: sets token, fetches profile, updates store and redirects to /', async () => {
    const mockUser = {
      id: '123',
      email: 'user@test.com',
      firstName: 'Alice',
      lastName: 'Smith',
      role: 'user',
    };

    getProfile.mockResolvedValue({ user: mockUser });

    render(
      <MemoryRouter initialEntries={['/auth/callback?token=valid-jwt-token']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<DummyComponent name="home" />} />
          <Route path="/login" element={<DummyComponent name="login" />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial loading state should render
    expect(screen.getByText(/connexion en cours/i)).toBeInTheDocument();

    await waitFor(() => {
      // Check if token was saved
      expect(setAccessToken).toHaveBeenCalledWith('valid-jwt-token');
      // Check if profile was fetched
      expect(getProfile).toHaveBeenCalled();
      // Check if Zustand store was updated
      const state = useAuthStore.getState();
      expect(state.user).toEqual({ user: mockUser });
      expect(state.accessToken).toBe('valid-jwt-token');
      expect(state.isAuthenticated).toBe(true);
      // Check redirect to home page
      expect(screen.getByTestId('home')).toBeInTheDocument();
    });
  });

  test('fails if token is missing in URL: redirects to /login?error=OAUTH_FAILED', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<DummyComponent name="login" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(setAccessToken).not.toHaveBeenCalled();
      expect(getProfile).not.toHaveBeenCalled();
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
  });

  test('fails if profile fetch throws error: redirects to /login?error=OAUTH_FAILED', async () => {
    getProfile.mockRejectedValue(new Error('Profile fetch failed'));

    render(
      <MemoryRouter initialEntries={['/auth/callback?token=invalid-jwt']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<DummyComponent name="login" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(setAccessToken).toHaveBeenCalledWith('invalid-jwt');
      expect(getProfile).toHaveBeenCalled();
      expect(screen.getByTestId('login')).toBeInTheDocument();
      // Store should remain empty
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
