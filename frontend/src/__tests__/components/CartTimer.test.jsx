import { render, screen, act } from '@testing-library/react';
import CartTimer from '../../components/CartTimer';

describe('CartTimer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders countdown correctly', () => {
    // 5 minutes in the future (300 seconds)
    const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();
    render(<CartTimer expiresAt={expiresAt} onExpire={jest.fn()} />);

    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  test('decrements time every second', () => {
    const expiresAt = new Date(Date.now() + 10 * 1000).toISOString();
    render(<CartTimer expiresAt={expiresAt} onExpire={jest.fn()} />);

    expect(screen.getByText('00:10')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:09')).toBeInTheDocument();
  });

  test('calls onExpire when countdown reaches zero', () => {
    const onExpireMock = jest.fn();
    const expiresAt = new Date(Date.now() + 2 * 1000).toISOString();
    
    render(<CartTimer expiresAt={expiresAt} onExpire={onExpireMock} />);

    expect(onExpireMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onExpireMock).toHaveBeenCalledTimes(1);
  });

  test('applies red warning class under 2 minutes', () => {
    // 110 seconds in the future (under 120s)
    const expiresAt = new Date(Date.now() + 110 * 1000).toISOString();
    render(<CartTimer expiresAt={expiresAt} onExpire={jest.fn()} />);

    const timerText = screen.getByText('01:50');
    expect(timerText).toHaveClass('text-brand-red');
  });
});
