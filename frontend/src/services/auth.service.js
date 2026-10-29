import api from "./api";


// ==========================================
// LOGIN
// ==========================================

const login = async (
    email,
    password,
    collegeCode
) => {

    const response =
        await api.post(
            "/auth/login",
            {
                email,
                password,
                collegeCode
            }
        );

    return response.data;
};


// ==========================================
// REGISTER
// ==========================================

const register = async ({
    name,
    email,
    password,
    collegeCode
}) => {

    const response =
        await api.post(
            "/auth/register",
            {
                name,
                email,
                password,
                collegeCode
            }
        );

    return response.data;
};


// ==========================================
// CHANGE PASSWORD
// ==========================================

const changePassword = async ({
    currentPassword,
    newPassword
}) => {

    const response =
        await api.patch(
            "/auth/change-password",
            {
                currentPassword,
                newPassword
            }
        );

    return response.data;
};


export {
    login,
    register,
    changePassword
};