import { Form, Head } from '@inertiajs/react';

import { store } from '@/actions/App/Http/Controllers/Auth/ForcePasswordChangeController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function ForcePasswordChange() {
    return (
        <>
            <Head title="Changement de mot de passe obligatoire" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Nouveau mot de passe"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirmer le nouveau mot de passe
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirmer le nouveau mot de passe"
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Changer le mot de passe
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ForcePasswordChange.layout = (page: any) => (
    <AuthLayout title="Changement de mot de passe" description="Pour votre première connexion, vous devez changer votre mot de passe.">
        {page}
    </AuthLayout>
);
