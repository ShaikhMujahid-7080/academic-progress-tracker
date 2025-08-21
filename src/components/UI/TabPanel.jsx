export function TabPanel({ children, value, index, className = "" }) {
  return (
    <div
      className={`transition-all duration-300 ${value !== index ? 'hidden opacity-0' : 'opacity-100'}`}
      style={{ display: value !== index ? 'none' : 'block' }}
    >
      <div className={`p-6 ${className}`}>{children}</div>
    </div>
  );
}
