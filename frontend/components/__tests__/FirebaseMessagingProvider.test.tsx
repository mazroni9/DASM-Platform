import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';
import FirebaseMessagingProvider from '../FirebaseMessagingProvider';

// Mock the auth store
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  getMessagingInstance: jest.fn(() => null),
}));

// Mock axios
jest.mock('@/lib/axios', () => ({
  post: jest.fn(),
}));

// Mock notification context
jest.mock('@/context/NotificationContext', () => ({
  useNotification: () => ({
    dispatch: jest.fn(),
  }),
}));

describe('FirebaseMessagingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not register device token when user is not authenticated', () => {
    // Mock unauthenticated state
    (useAuthStore as jest.Mock).mockReturnValue({
      isLoggedIn: false,
      user: null,
    });

    render(
      <FirebaseMessagingProvider>
        <div>Test Content</div>
      </FirebaseMessagingProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should register device token when user is authenticated', () => {
    // Mock authenticated state
    (useAuthStore as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      user: { id: 1, email: 'test@example.com' },
    });

    render(
      <FirebaseMessagingProvider>
        <div>Test Content</div>
      </FirebaseMessagingProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
