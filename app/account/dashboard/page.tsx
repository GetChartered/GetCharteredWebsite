import React from 'react'

import { UseBackend } from '@/src/components/UseBackend'


const accountDashboard = () => {
    //if not logged in go to login page

    try{
        //const data = UseBackend()

        return (
            <main>
                <h1>
                    Hello this is the account page
                </h1>
                <h2>
                    Email:
                    Current Course:
                    Current Plan:
                    Renewal Date:
                </h2>
            </main>
        )
    }catch(e){
        return (
            <main>
                <h1>
                    Error!!!!
                </h1>
            </main>
        )
    }

}

export default accountDashboard