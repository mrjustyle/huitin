'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface TourStep {
  target: string;       // CSS selector of element to highlight
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;      // optional: 'click' to auto-advance on click
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStep: number;
  startTour: (tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  tourId: string | null;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  isActive: false,
  currentStep: 0,
  startTour: () => {},
  endTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
  tourId: null,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

// Tour definitions
const TOURS: Record<string, TourStep[]> = {
  'first-visit': [
    {
      target: '[data-tour="welcome"]',
      title: 'Chào mừng đến Hụi Tín! 🎉',
      content: 'Đây là trang tổng quan. Bạn sẽ thấy tất cả dây hụi, việc cần làm và thống kê tại đây.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="create-hui"]',
      title: 'Tạo dây hụi đầu tiên 📋',
      content: 'Nhấn vào đây để tạo dây hụi mới. Chọn loại hụi, số tiền, lịch đóng và mời thành viên.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="my-hui"]',
      title: 'Dây hụi của tôi 📒',
      content: 'Xem và quản lý tất cả dây hụi bạn tham gia hoặc tạo.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="vip-banner"]',
      title: 'Nâng cấp VIP 💎',
      content: 'Mở khóa tính năng cao cấp: không giới hạn dây hụi, chế độ riêng tư, đối soát tự động.',
      placement: 'bottom',
    },
  ],
  'create-group': [
    {
      target: '[data-tour="group-name"]',
      title: 'Đặt tên dây hụi ✏️',
      content: 'Chọn tên dễ nhớ cho dây hụi. Ví dụ: "Hụi xóm mới 2026" hoặc "Nhóm tiết kiệm T7".',
      placement: 'bottom',
    },
    {
      target: '[data-tour="hui-type"]',
      title: 'Chọn loại hụi 🎯',
      content: 'Hụi sống: bỏ thảo mỗi kỳ (có lãi). Hụi chết: đều nhau, đơn giản hơn.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="share-value"]',
      title: 'Số tiền phần hụi 💰',
      content: 'Mỗi kỳ, mỗi hụi viên đóng số tiền này. Ví dụ: 1.000.000 ₫/kỳ.',
      placement: 'bottom',
    },
  ],
};

const STORAGE_KEY = 'huitin_onboarding_completed';

function getCompletedTours(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function markTourCompleted(tourId: string) {
  const completed = getCompletedTours();
  if (!completed.includes(tourId)) {
    completed.push(tourId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourId, setTourId] = useState<string | null>(null);

  const startTour = useCallback((id: string) => {
    const completed = getCompletedTours();
    if (completed.includes(id)) return; // Already completed
    if (!TOURS[id]) return;

    setTourId(id);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    if (tourId) markTourCompleted(tourId);
    setIsActive(false);
    setTourId(null);
    setCurrentStep(0);
  }, [tourId]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  const nextStep = useCallback(() => {
    if (!tourId) return;
    const steps = TOURS[tourId];
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      endTour();
    }
  }, [tourId, currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  return (
    <OnboardingContext.Provider value={{
      isActive,
      currentStep,
      startTour,
      endTour,
      nextStep,
      prevStep,
      skipTour,
      tourId,
    }}>
      {children}
      {isActive && tourId && TOURS[tourId] && (
        <TourOverlay
          steps={TOURS[tourId]}
          currentStep={currentStep}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      )}
    </OnboardingContext.Provider>
  );
}

// Auto-start tour for first-time visitors
export function OnboardingTrigger({ tourId }: { tourId: string }) {
  const { startTour } = useOnboarding();

  useEffect(() => {
    // Delay to let DOM render
    const timer = setTimeout(() => startTour(tourId), 800);
    return () => clearTimeout(timer);
  }, [tourId, startTour]);

  return null;
}

// Tour overlay component
function TourOverlay({
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
}: {
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const step = steps[currentStep];
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = document.querySelector(step.target);
    if (!el) {
      setPosition({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    // Scroll into view first, then calculate position after scroll settles
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();

      // Use viewport-relative positions (for fixed positioning)
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      // Calculate tooltip position (viewport-relative)
      const gap = 12;
      const tooltipWidth = 320;
      const placement = step.placement || 'bottom';
      let style: React.CSSProperties = {};

      // Center horizontally relative to target, clamp within viewport
      const centerX = Math.min(
        Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2),
        window.innerWidth - tooltipWidth - 16
      );

      switch (placement) {
        case 'bottom':
          style = { top: rect.bottom + gap, left: centerX };
          break;
        case 'top':
          style = { top: rect.top - gap - 200, left: centerX };
          break;
        case 'right':
          style = { top: rect.top + rect.height / 2 - 60, left: rect.right + gap };
          break;
        case 'left':
          style = { top: rect.top + rect.height / 2 - 60, left: rect.left - gap - tooltipWidth };
          break;
      }

      setTooltipStyle(style);
    };

    // Wait for scroll to finish
    const timer = setTimeout(updatePosition, 400);

    // Also update on scroll/resize
    const scrollParent = el.closest('[class*="main"]') || window;
    const handleScroll = () => requestAnimationFrame(updatePosition);
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      scrollParent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [step, currentStep]);

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {/* Backdrop with hole */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={position.left - 8}
                y={position.top - 8}
                width={position.width + 16}
                height={position.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.5)"
            mask="url(#tour-mask)"
            style={{ pointerEvents: 'auto' }}
            onClick={onSkip}
          />
        </svg>
      </div>

      {/* Spotlight border */}
      {position.width > 0 && (
        <div
          style={{
            position: 'fixed',
            top: position.top - 8,
            left: position.left - 8,
            width: position.width + 16,
            height: position.height + 16,
            border: '2px solid rgba(22, 160, 133, 0.8)',
            borderRadius: 12,
            boxShadow: '0 0 0 4px rgba(22, 160, 133, 0.2), 0 0 20px rgba(22, 160, 133, 0.3)',
            zIndex: 9999,
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
            animation: 'tourPulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          ...tooltipStyle,
          zIndex: 10000,
          width: 320,
          background: 'var(--bg-primary, #fff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 16,
          padding: '1.25rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          animation: 'tourFadeIn 0.3s ease',
        }}
      >
        {/* Step indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          <div style={{
            display: 'flex',
            gap: 4,
          }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? 20 : 8,
                  height: 4,
                  borderRadius: 2,
                  background: i === currentStep
                    ? 'var(--color-primary-500, #16A085)'
                    : 'var(--color-gray-200, #e2e8f0)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary, #94a3b8)',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            Bỏ qua
          </button>
        </div>

        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text-primary, #1a202c)',
          marginBottom: '0.5rem',
        }}>
          {step.title}
        </h3>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary, #64748b)',
          lineHeight: 1.6,
          marginBottom: '1rem',
        }}>
          {step.content}
        </p>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {!isFirst ? (
            <button
              onClick={onPrev}
              style={{
                background: 'none',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: 'var(--text-secondary, #64748b)',
              }}
            >
              ← Trước
            </button>
          ) : <div />}
          <button
            onClick={onNext}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-500, #16A085), var(--color-primary-600, #138D75))',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '6px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22, 160, 133, 0.3)',
            }}
          >
            {isLast ? 'Hoàn thành ✓' : 'Tiếp theo →'}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(22, 160, 133, 0.2), 0 0 20px rgba(22, 160, 133, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(22, 160, 133, 0.1), 0 0 30px rgba(22, 160, 133, 0.2); }
        }
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
