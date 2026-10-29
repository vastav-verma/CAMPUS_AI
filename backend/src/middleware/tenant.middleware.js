import User from "../models/User.js";
import College from "../models/College.js";

const attachTenant = async (req, res, next) => {

    try {

        const user = await User.findById(
            req.user.userId
        ).select("collegeId role isActive");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is disabled."
            });
        }

        const college = await College.findById(
            user.collegeId
        );

        if (!college || !college.isActive) {
            return res.status(403).json({
                success: false,
                message: "College account is inactive."
            });
        }

        req.tenant = {
            collegeId: college._id,
            collegeCode: college.collegeCode
        };

        req.user.role = user.role;

        next();

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to identify tenant."
        });
    }
};

export default attachTenant;