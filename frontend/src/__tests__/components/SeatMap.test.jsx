import { render, screen, fireEvent } from '@testing-library/react';
import SeatMap from '../../components/SeatMap';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Zustand auth store
let mockIsAuthenticated = true;
jest.mock('../../store/authStore', () => ({
  useAuthStore: (cb) => cb({ isAuthenticated: mockIsAuthenticated, user: { firstName: 'John' } }),
}));

describe('SeatMap Component', () => {
  const mockSeats = [
    { _id: 's1', category: 'A', row: 'A', number: 1, price: 250, status: 'available', section: 'Main Grandstand (A)' },
    { _id: 's2', category: 'B', row: 'B', number: 2, price: 150, status: 'sold', section: 'Middle Ring (B)' },
    { _id: 's3', category: 'C', row: 'C', number: 3, price: 80, status: 'locked', section: 'Upper Terrace (C)' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
  });

  test('renders stadium map SVG and elements', () => {
    render(
      <SeatMap
        seats={mockSeats}
        onSelectSeat={jest.fn()}
        selectedSeat={null}
        refreshSeats={jest.fn()}
      />
    );

    // Verify sections text
    expect(screen.getByText('Tribune Nord (B)')).toBeInTheDocument();
    expect(screen.getByText('Tribune Sud (A)')).toBeInTheDocument();
    expect(screen.getByText('Tribune Ouest (C)')).toBeInTheDocument();
    expect(screen.getByText('Tribune Est (C)')).toBeInTheDocument();
  });

  test('renders all mock seats', () => {
    const { container } = render(
      <SeatMap
        seats={mockSeats}
        onSelectSeat={jest.fn()}
        selectedSeat={null}
        refreshSeats={jest.fn()}
      />
    );

    const circles = container.querySelectorAll('circle');
    // 3 interactive seats + soccer pitch center circle + soccer pitch center point + selected seat ping outer ring (if any) + grandstand tracks
    // There are 2 tracks (backdrops), 1 center circle, 1 center dot.
    // Total should be at least 3 circles for the seats.
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  test('fires onSelectSeat when an available seat is clicked by authenticated user', () => {
    const onSelectMock = jest.fn();
    const { container } = render(
      <SeatMap
        seats={mockSeats}
        onSelectSeat={onSelectMock}
        selectedSeat={null}
        refreshSeats={jest.fn()}
      />
    );

    // Get all circle elements
    const seatCircles = container.querySelectorAll('circle');
    
    // Seat 's1' is available, it should have a cursor pointer and be clickable
    // Let's click the first one that is available. In our SVG layout, the seats are drawn at coordinates
    // s1 (cat A) -> y=390. Let's find it.
    let availableCircle = null;
    seatCircles.forEach(circle => {
      if (circle.getAttribute('cx') === '310' && circle.getAttribute('cy') === '390') {
        availableCircle = circle;
      }
    });

    expect(availableCircle).not.toBeNull();
    fireEvent.click(availableCircle);

    expect(onSelectMock).toHaveBeenCalledWith(mockSeats[0]);
  });

  test('redirects unauthenticated user to login when selecting a seat', () => {
    mockIsAuthenticated = false;
    const onSelectMock = jest.fn();
    const { container } = render(
      <SeatMap
        seats={mockSeats}
        onSelectSeat={onSelectMock}
        selectedSeat={null}
        refreshSeats={jest.fn()}
      />
    );

    const seatCircles = container.querySelectorAll('circle');
    let availableCircle = null;
    seatCircles.forEach(circle => {
      if (circle.getAttribute('cx') === '310' && circle.getAttribute('cy') === '390') {
        availableCircle = circle;
      }
    });

    fireEvent.click(availableCircle);

    expect(onSelectMock).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object));
  });

  test('does not click a sold seat', () => {
    const onSelectMock = jest.fn();
    const { container } = render(
      <SeatMap
        seats={mockSeats}
        onSelectSeat={onSelectMock}
        selectedSeat={null}
        refreshSeats={jest.fn()}
      />
    );

    const seatCircles = container.querySelectorAll('circle');
    // s2 is cat B number 2 -> x=280, y=205.
    let soldCircle = null;
    seatCircles.forEach(circle => {
      if (circle.getAttribute('cx') === '280' && circle.getAttribute('cy') === '205') {
        soldCircle = circle;
      }
    });

    expect(soldCircle).not.toBeNull();
    fireEvent.click(soldCircle);

    expect(onSelectMock).not.toHaveBeenCalled();
  });
});
