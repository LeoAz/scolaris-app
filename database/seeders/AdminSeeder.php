<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $country = Country::firstOrCreate(
            ['code' => 'FR'],
            ['name' => 'France']
        );

        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@scolaris.test'],
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'password' => Hash::make('password'),
            ]
        );
        $superAdmin->assignRole('Super admin');

        $admin = User::firstOrCreate(
            ['email' => 'admin@scolaris.test'],
            [
                'name' => 'Admin User',
                'username' => 'admin',
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole('Administrateur');
    }
}
