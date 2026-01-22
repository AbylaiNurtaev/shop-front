import api from './axios';

export const uploadPhoto = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await api.post('/uploads/photo', fd);
    return response.data?.url;
};

