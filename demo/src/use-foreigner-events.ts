import { useEffect, useMemo, useState } from 'react';

/**
 * Some events triggered outside the React render cycle need to get the latest React state.
 * However, since the event handler is only registered once, the handler doesn't have access
 * to the latest state at the moment each event is processed.
 *
 * Instead of processing each event in the event handler itself, force a new render cycle and
 * process the state via useEffect, where the latest state is available.
 */
export function useForeignerEvents<T>(setter: (data: T[]) => void) {
    const [, forceUpdate] = useState({});

    return useMemo(() => {
        const pendingEvents: T[] = [];

        return {
            registerEvent: (stateUpdate: T) => {
                pendingEvents.push(stateUpdate);
                forceUpdate({});
            },
            processEvents: (currentState: T[]) => {
                useEffect(() => {
                    if (pendingEvents.length > 0) {
                        const nextUpdate = pendingEvents.shift()!;
                        setter([...currentState, nextUpdate]);
                    }
                }, [pendingEvents.length]);
            },
        };
    }, []);
}
