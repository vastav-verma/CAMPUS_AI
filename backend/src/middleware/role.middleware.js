const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user?.role) {
            return res.status(403).json({
                success: false,
                message: "Role information missing."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource."
            });
        }

        next();
    };
};

export default authorizeRoles;