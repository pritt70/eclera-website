// Set coockies, get cookies, delete cookies, truncate, api function... all commun function define.

export async function api(endpoint: string, data?: any, method: string = "POST") {
    try {
        const cleanEndpoint = endpoint.replace(/^\/+/, "");
        // Prepend api/website if just a resource name like 'categories' or 'banners'
        const fullPath = cleanEndpoint.startsWith("api/") ? cleanEndpoint : `api/website/${cleanEndpoint}`;
        const isGet = method.toUpperCase() === "GET" || (data === undefined && method !== "POST");
        const url = `http://localhost:5000/${fullPath}`;
        
        const options: RequestInit = {
            method: isGet ? "GET" : "POST",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        };
        
        if (!isGet && data !== undefined) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        return await response.json();
    } catch (err: any) {
        console.error(`API Error [${endpoint}]:`, err?.message);
        return { status: false, message: err?.message || "Network request failed" };
    }
}

// Set cookie
export function setCookie(name: string, value: string, days: number) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
}

// Get cookie
export function getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Delete cookie
export function deleteCookie(name: string) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
}

// Truncate string
export function truncate(str: string, n: number) {
    return str.length > n ? str.slice(0, n) + "..." : str;
}

