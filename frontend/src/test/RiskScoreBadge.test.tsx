import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RiskScoreBadge from '../components/ui/RiskScoreBadge';

describe('RiskScoreBadge', () => {
  it('renders low risk badge for scores below 30', () => {
    render(<RiskScoreBadge score={15} />);

    expect(screen.getByText(/Low Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/15\/100/i)).toBeInTheDocument();
  });

  it('renders medium risk badge for scores between 30 and 59', () => {
    render(<RiskScoreBadge score={45} />);

    expect(screen.getByText(/Medium Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/45\/100/i)).toBeInTheDocument();
  });

  it('renders high risk badge for scores 60 and above', () => {
    render(<RiskScoreBadge score={75} />);

    expect(screen.getByText(/High Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/75\/100/i)).toBeInTheDocument();
  });

  it('applies correct color class for low risk', () => {
    const { container } = render(<RiskScoreBadge score={20} />);

    // The color class is on the inner div, not the wrapper
    const badge = container.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct color class for medium risk', () => {
    const { container } = render(<RiskScoreBadge score={50} />);

    const badge = container.querySelector('.bg-orange-100');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct color class for high risk', () => {
    const { container } = render(<RiskScoreBadge score={80} />);

    const badge = container.querySelector('.bg-red-100');
    expect(badge).toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    const { container } = render(<RiskScoreBadge score={50} />);

    const badge = container.querySelector('.bg-orange-100');
    if (badge) {
      fireEvent.mouseEnter(badge);
    }

    expect(screen.getByText(/Fraud risk score/i)).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    const { container } = render(<RiskScoreBadge score={50} />);

    const badge = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(badge);
    fireEvent.mouseLeave(badge);

    expect(screen.queryByText(/Fraud risk score/i)).not.toBeInTheDocument();
  });
});
