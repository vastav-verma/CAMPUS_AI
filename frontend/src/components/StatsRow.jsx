const StatsRow = ({ stats, items }) => (
    <div className="stats">
        {items.map((item) => (
            <div className={`stat stat-${item.key}`} key={item.key}>
                <span className="stat-num">{stats?.[item.key] ?? 0}</span>
                <span className="stat-label">{item.label}</span>
            </div>
        ))}
    </div>
);

export default StatsRow;
