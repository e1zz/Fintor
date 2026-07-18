import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@testing-library/react-native'

const { login, navigate } = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ login }),
}))

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate }),
}))

import LoginScreen from './LoginScreen'

beforeEach(() => {
  login.mockReset()
  navigate.mockReset()
})


it('shows sign-in UI', async () => {
  await render(<LoginScreen />)

  expect(screen.getByText('Fintor')).toBeOnTheScreen()
  expect(screen.getByPlaceholderText('Email')).toBeOnTheScreen()
  expect(screen.getByPlaceholderText('Password')).toBeOnTheScreen()
  expect(screen.getByText('Sign In')).toBeOnTheScreen()
})

it('shows error when fields empty', async () => {
  const user = userEvent.setup()
  await render(<LoginScreen />)

  await user.press(screen.getByText('Sign In'))

  expect(screen.getByText('Please fill in all fields')).toBeOnTheScreen()
  expect(login).not.toHaveBeenCalled()
})

it('calls login with email and password', async () => {
  const user = userEvent.setup()
  login.mockResolvedValue(undefined)
  await render(<LoginScreen />)

  await user.type(screen.getByPlaceholderText('Email'), 'a@b.com')
  await user.type(screen.getByPlaceholderText('Password'), 'secret')
  await user.press(screen.getByText('Sign In'))

  expect(login).toHaveBeenCalledWith('a@b.com', 'secret')
})

it('shows API error when login fails', async () => {
  const user = userEvent.setup()
  login.mockRejectedValue({ response: { data: { detail: 'Nope' } } })
  await render(<LoginScreen />)

  await user.type(screen.getByPlaceholderText('Email'), 'a@b.com')
  await user.type(screen.getByPlaceholderText('Password'), 'secret')
  await user.press(screen.getByText('Sign In'))

  expect(await screen.findByText('Nope')).toBeOnTheScreen()
})
