export function getPayloadFromToken() {
    const token = localStorage.getItem("token");  // or sessionStorage if that's what you use
    if (!token) return null;

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
}