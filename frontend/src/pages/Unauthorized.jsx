import { Link } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { getHomeRoute } from "../utils/constants";

const Unauthorized = () => {
    const { user } = useAuth();

    return (
        <AuthShell
            title="Access denied"
            subtitle="Your account does not have permission to open this page."
            footer={<Link to={user ? getHomeRoute(user.role) : "/login"}>Back to your dashboard</Link>}
        />
    );
};

export default Unauthorized;
