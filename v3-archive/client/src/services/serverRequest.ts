export default async function (
    method: string,
    path: string,
    body?: { [key: string]: any }
): Promise<{ status: number; data?: { [key: string]: any }; error?: string }> {
    const apiRes = await fetch(`${process.env.BACKEND_BASE_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (apiRes.status.toString().startsWith('2')) {
        return { status: apiRes.status, data: await apiRes.json() };
    } else {
        return { status: apiRes.status, error: (await apiRes.json()).error };
    }
}
