import { useState } from "react"

const initialState = {
    owners:[]
}

const useInitialState = () =>{
    const [connected, setConnected] = useState(initialState);

    const addToMeeting = (payload) =>{
        setConnected({
            ...connected,
            owners:[...connected.owners, payload]
        });
    };

    const removeToMeeting = (payload) =>{
        setConnected({
            ...connected,
            owners: connected.owners.filter(items => items.id != payload.id)
        });
    }

    return {
        connected,
        addToMeeting,
        removeToMeeting, 
    }
}
export default useInitialState;