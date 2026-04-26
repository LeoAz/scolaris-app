<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Récapitulatif Dossier {{ $creditRequest->code }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1a56db;
            padding-bottom: 10px;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 10px;
        }
        h1 {
            color: #1a56db;
            font-size: 20px;
            margin: 0;
        }
        h2 {
            color: #1a56db;
            font-size: 16px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-top: 20px;
        }
        .section {
            margin-bottom: 20px;
        }
        .grid {
            width: 100%;
            border-collapse: collapse;
        }
        .grid td {
            padding: 5px 0;
            vertical-align: top;
        }
        .label {
            font-weight: bold;
            width: 30%;
            color: #6b7280;
        }
        .value {
            width: 70%;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table th, .table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
        }
        .table th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #374151;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-valider { background-color: #def7ec; color: #03543f; }
        .status-creation { background-color: #e1effe; color: #1e429f; }
        .status-soumis { background-color: #fdf6b2; color: #723b13; }
        .status-rejeter { background-color: #fde8e8; color: #9b1c1c; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        @if(file_exists(public_path('img/scolaris_logo.png')))
            <img src="{{ public_path('img/scolaris_logo.png') }}" class="logo" alt="Scolaris Logo">
        @endif
        <h1>Récapitulatif du Dossier de Crédit</h1>
        <p>Référence : <strong>{{ $creditRequest->code }}</strong></p>
    </div>

    <div class="section">
        <h2>Informations Générales</h2>
        <table class="grid">
            <tr>
                <td class="label">Statut :</td>
                <td class="value">
                    <span class="status-badge status-{{ $creditRequest->status->value }}">
                        {{ ucfirst($creditRequest->status->value) }}
                    </span>
                </td>
            </tr>
            <tr>
                <td class="label">Date de création :</td>
                <td class="value">{{ $creditRequest->created_at->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td class="label">Pays :</td>
                <td class="value">{{ $creditRequest->country->name ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Informations de l'Étudiant</h2>
        <table class="grid">
            <tr>
                <td class="label">Nom complet :</td>
                <td class="value">{{ $student->full_name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Email :</td>
                <td class="value">{{ $student->email ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Téléphone :</td>
                <td class="value">{{ $student->phone ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Adresse :</td>
                <td class="value">{{ $student->address ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    @if($guarantor)
    <div class="section">
        <h2>Informations du Garant</h2>
        <table class="grid">
            <tr>
                <td class="label">Nom complet :</td>
                <td class="value">{{ $guarantor->full_name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Profession :</td>
                <td class="value">{{ $guarantor->profession ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Téléphone :</td>
                <td class="value">{{ $guarantor->phone ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>
    @endif

    <div class="section">
        <h2>Détails du Crédit</h2>
        <table class="grid">
            <tr>
                <td class="label">Type de crédit :</td>
                <td class="value">{{ $creditType->name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Montant demandé :</td>
                <td class="value">{{ number_format($creditRequest->amount_requested, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <td class="label">Taux d'intérêt :</td>
                <td class="value">{{ $creditType->rate ?? 0 }} %</td>
            </tr>
            <tr>
                <td class="label">Durée :</td>
                <td class="value">{{ $creditType->duration_months ?? 0 }} mois</td>
            </tr>
        </table>
    </div>

    @if($installments->count() > 0)
    <div class="section">
        <h2>Échéancier de Remboursement</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Date d'échéance</th>
                    <th class="text-right">Montant</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                @foreach($installments as $installment)
                <tr>
                    <td>{{ $installment->installment_number }}</td>
                    <td>{{ $installment->due_date->format('d/m/Y') }}</td>
                    <td class="text-right">{{ number_format($installment->total_amount, 0, ',', ' ') }} FCFA</td>
                    <td>{{ ucfirst($installment->status) }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <th colspan="2" class="text-right">Total</th>
                    <th class="text-right">{{ number_format($installments->sum('total_amount'), 0, ',', ' ') }} FCFA</th>
                    <th></th>
                </tr>
            </tfoot>
        </table>
    </div>
    @endif

    <div class="footer">
        <p>Document généré automatiquement par Scolaris le {{ now()->format('d/m/Y à H:i') }}</p>
        <p>&copy; {{ date('Y') }} Scolaris. Tous droits réservés.</p>
    </div>
</body>
</html>
