<?php

namespace Database\Seeders;

use App\Models\CreditRequest;
use App\Models\CreditRequestActivity;
use App\Models\User;
use Illuminate\Database\Seeder;

class CreditRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            $users = User::factory()->count(5)->create();
        }

        CreditRequest::factory()
            ->count(50)
            ->create()
            ->each(function ($request) use ($users) {
                // Création d'une activité initiale de création
                CreditRequestActivity::create([
                    'credit_request_id' => $request->id,
                    'user_id' => $request->created_by_id,
                    'action' => 'creation',
                    'description' => 'Le dossier a été créé.',
                    'created_at' => $request->created_at,
                ]);

                // Ajouter quelques activités aléatoires
                $count = rand(0, 3);
                for ($i = 0; $i < $count; $i++) {
                    CreditRequestActivity::factory()->create([
                        'credit_request_id' => $request->id,
                        'user_id' => $users->random()->id,
                        'created_at' => $request->created_at->addHours(rand(1, 48)),
                    ]);
                }
            });
    }
}
