"use client";

export default function LogoutButton() {
    return (
        <a
            href="/auth/logout"
            className="btn btn-ghost btn-md"
            style={{ width: '100%' }}
        >
            Log Out
        </a>
    );
}