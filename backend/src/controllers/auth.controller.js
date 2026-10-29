import {
    changePassword,
    registerUser,
    loginUser,
    getCurrentUser
} from "../services/auth.service.js";


const register = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            collegeCode
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !collegeCode
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const result = await registerUser({
            name,
            email,
            password,
            collegeCode
        });

        res.status(201).json({
            success: true,
            message: "Registration successful.",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const login = async (req, res) => {

    try {

        const {
            email,
            password,
            collegeCode
        } = req.body;

        if (!email || !password || !collegeCode) {
            return res.status(400).json({
                success: false,
                message: "Email, password and college code are required."
            });
        }

        const result = await loginUser({
            email,
            password,
            collegeCode
        });

        res.status(200).json({
            success: true,
            message: "Login successful.",
            data: result
        });

    } catch (error) {

        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};


const getMe = async (req, res) => {

    try {

        const user = await getCurrentUser(
            req.user.userId
        );

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updatePassword = async (req, res) => {

    try {

        await changePassword({
            userId: req.user.userId,
            currentPassword: req.body?.currentPassword,
            newPassword: req.body?.newPassword
        });

        res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


export {
    updatePassword,
    register,
    login,
    getMe
};