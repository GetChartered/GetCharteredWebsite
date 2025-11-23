import { auth0 } from "@/src/lib/auth0";
import LoginButton from "@/src/components/LoginButton";
import LogoutButton from "@/src/components/LogoutButton";
import Profile from "@/src/components/Profile";

export default async function Home() {
    const session = await auth0.getSession();
    const user = session?.user;

    return (
        <div className="app-container">
            <div className="main-card-wrapper">
                <img
                    src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png"
                    alt="Auth0 Logo"
                    className="auth0-logo"
                />
                <h1 className="main-title">Next.js + Auth0</h1>

                <div className="action-card">
                    {user ? (
                        <div className="logged-in-section">
                            <p className="logged-in-message">✅ Successfully logged in!</p>
                            <Profile />
                            <LogoutButton />
                        </div>
                    ) : (
                        <>
                            <p className="action-text">
                                Welcome! Please log in to access your protected content.
                            </p>
                            <LoginButton />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}