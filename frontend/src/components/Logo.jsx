const Logo = ({ light = false }) => (
    <span className={`logo ${light ? "logo-light" : ""}`}>
        <span className="logo-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
            </svg>
        </span>
        <span className="logo-text">CampusAI</span>
    </span>
);

export default Logo;
