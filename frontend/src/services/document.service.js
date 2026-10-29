import api from "./api";


// ==========================================
// GET DOCUMENTS
// ==========================================

const getDocuments = async () => {

    const response =
        await api.get(
            "/documents"
        );

    return response.data;
};


// ==========================================
// UPLOAD DOCUMENT
// ==========================================

const uploadDocument = async (
    file,
    title
) => {

    const formData =
        new FormData();

    formData.append(
        "document",
        file
    );

    formData.append(
        "title",
        title
    );


    const response =
        await api.post(
            "/documents/upload",
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data"
                }
            }
        );


    return response.data;
};


// ==========================================
// DELETE DOCUMENT
// ==========================================

const deleteDocument = async (
    documentId
) => {

    const response =
        await api.delete(
            `/documents/${documentId}`
        );

    return response.data;
};


export {
    getDocuments,
    uploadDocument,
    deleteDocument
};