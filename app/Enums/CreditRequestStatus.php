<?php

namespace App\Enums;

enum CreditRequestStatus: string
{
    case CREATION = 'creation';
    case SOUMIS = 'soumis';
    case VALIDER = 'valider';
    case REJETER = 'rejeter';
    case CLOTURER = 'cloturer';
    case RESILIE = 'resilie';

    public function label(): string
    {
        return match ($this) {
            self::CREATION => 'Création',
            self::SOUMIS => 'Soumis',
            self::VALIDER => 'Validé',
            self::REJETER => 'Rejeté',
            self::CLOTURER => 'Cloturer',
            self::RESILIE => 'Résilié',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::CREATION => 'blue',
            self::SOUMIS => 'orange',
            self::VALIDER => 'green',
            self::REJETER => 'red',
            self::CLOTURER => 'gray',
            self::RESILIE => 'purple',
        };
    }
}
