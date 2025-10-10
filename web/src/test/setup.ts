import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { mockSupabase } from './mocks/supabase';

// Mock Supabase globally
vi.mock('@dislink/shared/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock Framer Motion to prevent test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    img: 'img',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer',
    nav: 'nav',
    main: 'main',
    aside: 'aside',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
    a: 'a',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    option: 'option',
    label: 'label',
    fieldset: 'fieldset',
    legend: 'legend',
    table: 'table',
    thead: 'thead',
    tbody: 'tbody',
    tr: 'tr',
    th: 'th',
    td: 'td',
    caption: 'caption',
    colgroup: 'colgroup',
    col: 'col',
    tfoot: 'tfoot'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
    controls: {
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn()
    }
  }),
  useInView: () => [vi.fn(), false],
  useMotionValue: (value: any) => ({
    get: () => value,
    set: vi.fn(),
    onChange: vi.fn()
  }),
  useTransform: (value: any, inputRange: any[], outputRange: any[]) => ({
    get: () => outputRange[0],
    set: vi.fn(),
    onChange: vi.fn()
  }),
  useSpring: (value: any) => ({
    get: () => value,
    set: vi.fn(),
    onChange: vi.fn()
  }),
  usePresence: () => [true, vi.fn()],
  useDragControls: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    dragControls: {
      start: vi.fn(),
      stop: vi.fn()
    }
  }),
  useReducedMotion: () => false,
  useElementScroll: () => ({
    scrollX: { get: () => 0, set: vi.fn(), onChange: vi.fn() },
    scrollY: { get: () => 0, set: vi.fn(), onChange: vi.fn() }
  }),
  useViewportScroll: () => ({
    scrollX: { get: () => 0, set: vi.fn(), onChange: vi.fn() },
    scrollY: { get: () => 0, set: vi.fn(), onChange: vi.fn() }
  }),
  useCycle: (initial: any) => [initial, vi.fn()],
  useAnimationControls: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn()
  }),
  useMotionValueEvent: vi.fn(),
  useScroll: () => ({
    scrollX: { get: () => 0, set: vi.fn(), onChange: vi.fn() },
    scrollY: { get: () => 0, set: vi.fn(), onChange: vi.fn() },
    scrollXProgress: { get: () => 0, set: vi.fn(), onChange: vi.fn() },
    scrollYProgress: { get: () => 0, set: vi.fn(), onChange: vi.fn() }
  }),
  useTransform: vi.fn(),
  useVelocity: vi.fn()
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: vi.fn(),
  }),
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};