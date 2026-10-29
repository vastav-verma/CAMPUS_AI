import generateToken from "./generateToken.js";

export const authResponse = (user) => ({
    token: generateToken(user),
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId,
        role: user.role,
        department: user.department
    }
});
