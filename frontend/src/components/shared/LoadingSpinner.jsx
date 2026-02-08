import './shared.css';

export function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
    const sizeClass = `spinner-${size}`;
    return (
        <div className={`loading-spinner ${sizeClass}`} role="status">
            <div className="spinner-ring" />
            {label && <span className="spinner-label">{label}</span>}
        </div>
    );
}

export default LoadingSpinner;
