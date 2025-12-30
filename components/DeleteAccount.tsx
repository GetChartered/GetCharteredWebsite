import CancelSubscription from "@/components/CancelSubscription";
import {auth0} from "@/lib/auth0";

export default async function DeleteAccount(formData: FormData){
    //Store user email in variable
    //Delete Auth0 account
    //Cancel Subscription


    await CancelSubscription(formData);

}