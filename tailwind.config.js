/** MYD 디자인 가이드(CRM Base Design System) 토큰을 Tailwind 테마로 매핑 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          default: '#F8FAFC',
          surface: '#FFFFFF',
          subtle: '#F1F5F9',
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
          'primary-active': '#1E40AF',
          'primary-subtle': '#EFF6FF',
        },
        fg: {
          primary: '#0F172A',
          secondary: '#475569',
          tertiary: '#64748B',
          inverse: '#FFFFFF',
          link: '#2563EB',
        },
        line: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
          primary: '#2563EB',
          focus: '#3B82F6',
        },
        danger: { DEFAULT: '#DC2626', subtle: '#FEF2F2' },
        success: { DEFAULT: '#16A34A' },
        warn: { DEFAULT: '#B45309', subtle: '#FFFBEB', line: '#FDE68A' },
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '999px',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      fontSize: {
        caption: ['12px', '18px'],
        compact: ['13px', '20px'],
        body: ['14px', '22px'],
        title: ['16px', '24px'],
        heading: ['24px', '32px'],
      },
      height: { control: '40px', 'control-sm': '32px' },
    },
  },
  plugins: [],
};
