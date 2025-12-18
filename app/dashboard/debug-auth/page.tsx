import { cookies } from 'next/headers'

// Duplicate of getSessionUser to display raw data
async function getDebugSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
        return { status: 'No Cookie Found', raw: null, parsed: null }
    }

    try {
        const val = sessionCookie.value
        const parsed = JSON.parse(val)
        return { status: 'Cookie Found', raw: val, parsed: parsed }
    } catch (e: any) {
        return { status: 'Parse Error', raw: sessionCookie.value, error: e.message }
    }
}

export default async function DebugAuthPage() {
    const sessionData = await getDebugSession()

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Auth Debugger</h1>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="font-semibold mb-2">Server-Side Session Cookie</h2>
                <pre className="bg-white p-2 border rounded overflow-auto text-sm">
                    {JSON.stringify(sessionData, null, 2)}
                </pre>
            </div>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="font-semibold mb-2">Instructions</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>If "status" is "No Cookie Found", the browser is not sending the cookie or it was not set.</li>
                    <li>If "parsed" has a user object, that is what the server actions see.</li>
                </ul>
            </div>
        </div>
    )
}
