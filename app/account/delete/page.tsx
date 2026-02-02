import Form from "next/form";
import DeleteAccount from "@/components/DeleteAccount";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default async function Delete() {
    const session = await auth0.getSession();
    if (!session) {
        redirect("/auth/login");
    }

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="flex items-center justify-center p-4 py-24">
            <div className="card max-w-md w-full p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-color-danger/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-title font-bold text-text-main mb-2">
                        Delete Your Account
                    </h2>
                    <p className="text-body text-text-secondary">
                        This action is permanent and cannot be undone. All your data, subscription, and progress will be lost.
                    </p>
                </div>

                <Form action={DeleteAccount}>
                    <fieldset className="mb-6">
                        <legend className="text-label font-medium text-text-main mb-4">
                            Why are you leaving? (optional)
                        </legend>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-color-tint cursor-pointer transition-colors">
                                <input type="radio" name="reason" value="I no longer need it" className="accent-color-tint" />
                                <span className="text-body text-text-main">I no longer need it</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-color-tint cursor-pointer transition-colors">
                                <input type="radio" name="reason" value="Too Expensive" className="accent-color-tint" />
                                <span className="text-body text-text-main">Too expensive</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-color-tint cursor-pointer transition-colors">
                                <input type="radio" name="reason" value="Other" className="accent-color-tint" />
                                <span className="text-body text-text-main">Other</span>
                            </label>
                        </div>
                    </fieldset>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            className="btn btn-danger w-full"
                        >
                            Permanently Delete Account
                        </button>
                        <Link
                            href="/my-account"
                            className="btn btn-outline w-full text-center"
                        >
                            Cancel
                        </Link>
                    </div>
                </Form>
            </div>
            </div>

            <Footer />
        </div>
    );
}