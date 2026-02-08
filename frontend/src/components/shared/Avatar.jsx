import './shared.css';

export function Avatar({ name, size = 'md', imageUrl, online }) {
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const sizeClass = `avatar-${size}`;

    // Generate consistent color from name
    const colors = ['#c9a227', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

    return (
        <div className={`avatar ${sizeClass}`} style={{ position: 'relative' }}>
            {imageUrl ? (
                <img src={imageUrl} alt={name} className="avatar-img" />
            ) : (
                <div className="avatar-initials" style={{ backgroundColor: colors[colorIndex] }}>
                    {initials}
                </div>
            )}
            {online !== undefined && (
                <span className={`avatar-status ${online ? 'online' : 'offline'}`} />
            )}
        </div>
    );
}

export default Avatar;
