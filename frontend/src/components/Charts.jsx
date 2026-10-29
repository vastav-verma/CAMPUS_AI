// Dependency-free SVG / CSS charts.

export const DonutChart = ({ data, centerLabel = "Total" }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="donut">
            <svg viewBox="0 0 140 140" role="img" aria-label="Status breakdown">
                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#eef2f7"
                    strokeWidth="18"
                />

                {total > 0 &&
                    data
                        .filter((d) => d.value > 0)
                        .map((d) => {
                            const length = (d.value / total) * circumference;
                            const circle = (
                                <circle
                                    key={d.label}
                                    cx="70"
                                    cy="70"
                                    r={radius}
                                    fill="none"
                                    stroke={d.color}
                                    strokeWidth="18"
                                    strokeDasharray={`${length} ${circumference - length}`}
                                    strokeDashoffset={-offset}
                                    transform="rotate(-90 70 70)"
                                />
                            );
                            offset += length;
                            return circle;
                        })}

                <text x="70" y="68" textAnchor="middle" className="donut-num">
                    {total}
                </text>
                <text x="70" y="86" textAnchor="middle" className="donut-cap">
                    {centerLabel}
                </text>
            </svg>

            <ul className="legend">
                {data.map((d) => (
                    <li key={d.label}>
                        <i style={{ background: d.color }} />
                        {d.label}
                        <strong>{d.value}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const HBarList = ({ items, color = "var(--brand)", emptyText = "No data yet." }) => {
    const max = Math.max(...items.map((i) => i.value), 1);

    if (items.length === 0) return <p className="empty">{emptyText}</p>;

    return (
        <ul className="hbars">
            {items.map((item) => (
                <li key={item.label}>
                    <div className="hbar-top">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                    </div>
                    <div className="hbar-track">
                        <div
                            className="hbar-fill"
                            style={{
                                width: `${(item.value / max) * 100}%`,
                                background: item.color || color
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
};

export const TrendChart = ({ data }) => {
    const width = 640;
    const height = 220;
    const pad = { top: 12, right: 8, bottom: 28, left: 28 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const max = Math.max(...data.flatMap((d) => [d.created, d.resolved]), 1);
    const niceMax = Math.max(Math.ceil(max / 2) * 2, 2);
    const slot = innerW / data.length;
    const barW = Math.min(slot / 2.6, 14);
    const y = (v) => pad.top + innerH - (v / niceMax) * innerH;
    const step = Math.ceil(data.length / 7);

    return (
        <div>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="trend"
                role="img"
                aria-label="Complaints created and resolved per day"
            >
                {[0, 0.5, 1].map((t) => (
                    <g key={t}>
                        <line
                            x1={pad.left}
                            x2={width - pad.right}
                            y1={y(niceMax * t)}
                            y2={y(niceMax * t)}
                            stroke="#eef2f7"
                        />
                        <text
                            x={pad.left - 6}
                            y={y(niceMax * t) + 4}
                            textAnchor="end"
                            className="axis"
                        >
                            {Math.round(niceMax * t)}
                        </text>
                    </g>
                ))}

                {data.map((d, i) => {
                    const cx = pad.left + slot * i + slot / 2;

                    return (
                        <g key={d.date}>
                            <title>{`${d.date}: ${d.created} created, ${d.resolved} resolved`}</title>
                            <rect
                                x={cx - barW - 1}
                                y={y(d.created)}
                                width={barW}
                                height={pad.top + innerH - y(d.created)}
                                rx="3"
                                style={{ fill: "var(--brand)" }}
                            />
                            <rect
                                x={cx + 1}
                                y={y(d.resolved)}
                                width={barW}
                                height={pad.top + innerH - y(d.resolved)}
                                rx="3"
                                fill="#16a34a"
                            />
                            {i % step === 0 && (
                                <text
                                    x={cx}
                                    y={height - 8}
                                    textAnchor="middle"
                                    className="axis"
                                >
                                    {d.date.slice(5)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            <ul className="legend legend-inline">
                <li><i style={{ background: "var(--brand)" }} />Created</li>
                <li><i style={{ background: "#16a34a" }} />Resolved</li>
            </ul>
        </div>
    );
};
