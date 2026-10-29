import { useEffect, useState } from "react";

import { fetchProofBlob } from "../services/complaint.service";

const ProofImage = ({ complaintId }) => {
    const [url, setUrl] = useState("");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let objectUrl = "";
        let cancelled = false;

        fetchProofBlob(complaintId)
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [complaintId]);

    if (failed) {
        return (
            <p className="muted">Proof image could not be loaded.</p>
        );
    }

    if (!url) return <p className="muted">Loading proof image...</p>;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer">
            <img
                className="proof"
                src={url}
                alt="Resolution proof"
            />
        </a>
    );
};

export default ProofImage;
