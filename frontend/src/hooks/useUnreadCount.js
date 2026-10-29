import { useCallback, useEffect, useState } from "react";

import { getUnreadCount } from "../services/notification.service";

// Polls the unread-notification count. Pauses while the tab is hidden
// and refreshes immediately when the user comes back to it.
const useUnreadCount = (intervalMs = 20000) => {
    const [count, setCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const result = await getUnreadCount();
            setCount(result?.data?.count ?? 0);
        } catch {
            // Silent: a missed poll is harmless.
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refresh();

        const timer = setInterval(() => {
            if (!document.hidden) refresh();
        }, intervalMs);

        const onVisible = () => {
            if (!document.hidden) refresh();
        };

        document.addEventListener("visibilitychange", onVisible);

        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refresh, intervalMs]);

    return { count, setCount, refresh };
};

export default useUnreadCount;
