const baseUrl = import.meta?.env?.BASE_URL ?? '/';
const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

export const LOCAL_TINYMCE_SCRIPT = `${normalizedBaseUrl || ''}/js/tinymce/tinymce.min.js`;


