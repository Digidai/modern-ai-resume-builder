import { useEffect, useState, useRef } from 'react';

interface UseIntersectionObserverProps {
    threshold?: number;
    root?: Element | null;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}): [React.RefObject<HTMLDivElement | null>, boolean] {
    const [entry, setEntry] = useState<IntersectionObserverEntry>();
    const [frozen, setFrozen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const frozenState = frozen;
    const entryState = entry;

    useEffect(() => {
        // If we've already frozen the state to "visible", no need to observe anymore
        if (freezeOnceVisible && frozenState) return;

        const node = ref.current;
        if (!node) return;

        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            setFrozen(true);
            return;
        }

        const observerParams = { threshold, root, rootMargin };
        const observer = new IntersectionObserver(([entry]) => {
            setEntry(entry);
            if (freezeOnceVisible && entry.isIntersecting) {
                setFrozen(true);
            }
        }, observerParams);

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [ref, threshold, root, rootMargin, freezeOnceVisible, frozenState]);

    return [ref, !!entryState?.isIntersecting || frozenState];
}
