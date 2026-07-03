/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      colors: {
        // โทนน้ำเงิน–เขียว สื่อระบบทรัพย์สิน/คลัง
        brand: {
          DEFAULT: '#0f766e', // teal-700
          light: '#14b8a6',
          dark: '#134e4a',
        },
      },
      // ปุ่ม/แตะบนมือถือให้ใหญ่พอ (ช่างใช้หน้างาน)
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
