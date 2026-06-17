export default function Spinner({ size = 'md', white = false, className = '' }) {
  return (
    <span className={`spinner spinner-${size}${white ? ' spinner-white' : ''} ${className}`} />
  )
}
