<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

#[Signature('users:fill-plain-passwords {password? : Le mot de passe par défaut à assigner si vide}')]
#[Description('Rempli le champ password_plain pour les utilisateurs qui n\'en ont pas. Attention: cela réinitialise leur mot de passe si un mot de passe par défaut est fourni.')]
class SyncUserPlainPasswords extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $defaultPassword = $this->argument('password');
        $users = User::whereNull('password_plain')->orWhere('password_plain', '')->get();

        if ($users->isEmpty()) {
            $this->info('Tous les utilisateurs ont déjà un mot de passe en clair enregistré.');

            return;
        }

        if (! $defaultPassword) {
            $this->warn('Certains utilisateurs n\'ont pas de mot de passe en clair (probablement créés avant la migration).');
            $this->warn('Impossible de récupérer les mots de passe hachés.');
            $this->info('Vous pouvez lancer cette commande avec un mot de passe par défaut pour les mettre à jour :');
            $this->info('php artisan users:fill-plain-passwords "nouveau_password"');

            return;
        }

        if (! $this->confirm("Voulez-vous vraiment réinitialiser le mot de passe de {$users->count()} utilisateurs avec \"$defaultPassword\" ?")) {
            return;
        }

        $this->withProgressBar($users, function (User $user) use ($defaultPassword) {
            $user->update([
                'password' => Hash::make($defaultPassword),
                'password_plain' => $defaultPassword,
            ]);
        });

        $this->newLine();
        $this->info("{$users->count()} utilisateurs mis à jour avec succès.");
    }
}
