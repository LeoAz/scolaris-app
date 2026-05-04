import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const { props } = usePage();
    const lastToastRef = useRef<string | null>(null);

    useEffect(() => {
        const flash = props.flash as any;

        if (flash?.toast) {
            const data = flash.toast as FlashToast;
            const toastKey = `toast:${data.type}:${data.message}`;

            if (lastToastRef.current !== toastKey) {
                toast[data.type](data.message);
                lastToastRef.current = toastKey;
            }
        } else if (flash?.success) {
            const toastKey = `success:${flash.success}`;

            if (lastToastRef.current !== toastKey) {
                toast.success(flash.success);
                lastToastRef.current = toastKey;
            }
        } else if (flash?.error) {
            const toastKey = `error:${flash.error}`;

            if (lastToastRef.current !== toastKey) {
                toast.error(flash.error);
                lastToastRef.current = toastKey;
            }
        } else {
            // Only reset if BOTH success, error and toast are empty
            if (!flash?.success && !flash?.error && !flash?.toast) {
                lastToastRef.current = null;
            }
        }
    }, [props.flash]);
}
