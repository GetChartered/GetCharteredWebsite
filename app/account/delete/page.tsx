import Form from "next/form";
import DeleteAccount from "@/components/DeleteAccount";

export default async function Delete(){
    //Cancel Subscription
    //Ask for reason
    //Delete account
    //Return to home page
    return(
        <div>
            <p>We&apos;re sad to see you go</p>
            <p>We&apos;d love to know why you&apos;re leaving so we can improve our products.</p>
            <p>Reason: </p>
            <Form action={DeleteAccount}>
                {/* On submission, the input value will be appended to
          the URL, e.g. /search?query=abc */}
                <input type="radio" id="I no Longer need it" name="reason" value="I no Longer need it"/>
                <label htmlFor="I no Longer need it">I no Longer need it</label><br></br>

                <input type="radio" id="Too Expensive" name="reason" value="Too Expensive"/>
                <label htmlFor="Too Expensive">Too Expensive</label><br></br>

                <input type="radio" id="Other" name="reason" value="Other"/>
                <label htmlFor="html">Other</label><br></br>

                <button
                    type="submit"
                >
                    Delete Account
                </button>
            </Form>
        </div>
    );
}