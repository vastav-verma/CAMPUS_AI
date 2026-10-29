export const ListSkeleton = ({ rows = 3 }) => (
    <div className="list" aria-busy="true" aria-label="Loading">
        {Array.from({ length: rows }).map((_, index) => (
            <div className="row skel-row" key={index}>
                <div style={{ flex: 1 }}>
                    <div className="skel" style={{ width: "45%", height: 18 }} />
                    <div className="skel" style={{ width: "30%", height: 12, marginTop: 10 }} />
                    <div className="skel" style={{ width: "85%", height: 12, marginTop: 10 }} />
                </div>
            </div>
        ))}
    </div>
);

export const BlockSkeleton = ({ height = 160 }) => (
    <div className="skel" style={{ height, width: "100%" }} />
);
