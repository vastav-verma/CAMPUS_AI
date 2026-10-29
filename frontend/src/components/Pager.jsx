const Pager = ({ pagination, onChange }) => {
    if (!pagination || pagination.pages <= 1) return null;

    return (
        <div className="pager">
            <button
                type="button"
                className="btn btn-ghost"
                disabled={pagination.page <= 1}
                onClick={() => onChange(pagination.page - 1)}
            >
                ← Previous
            </button>

            <span>
                Page {pagination.page} of {pagination.pages}
            </span>

            <button
                type="button"
                className="btn btn-ghost"
                disabled={pagination.page >= pagination.pages}
                onClick={() => onChange(pagination.page + 1)}
            >
                Next →
            </button>
        </div>
    );
};

export default Pager;
