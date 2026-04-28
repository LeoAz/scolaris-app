<?php

namespace App\Models;

use App\Enums\CreditRequestStatus;
use App\Jobs\GenerateDocumentJob;
use App\Models\Traits\HasCountryFilter;
use Database\Factories\CreditRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CreditRequest extends Model implements HasMedia
{
    /** @use HasFactory<CreditRequestFactory> */
    use HasCountryFilter, HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'code',
        'credit_type_id',
        'student_id',
        'guarantor_id',
        'created_by_id',
        'country_id',
        'amount_requested',
        'initial_contribution',
        'insurance_amount',
        'processing_fees_variable',
        'processing_fees_fixed',
        'first_month_interest',
        'total_microfinance_fees',
        'status',
        'submitted_at',
        'validated_at',
        'rejected_at',
        'validated_by_id',
        'rejected_by_id',
        'rejection_reason',
        'created_at',
        'searchable',
    ];

    protected $casts = [
        'amount_requested' => 'decimal:2',
        'initial_contribution' => 'decimal:2',
        'insurance_amount' => 'decimal:2',
        'processing_fees_variable' => 'decimal:2',
        'processing_fees_fixed' => 'decimal:2',
        'first_month_interest' => 'decimal:2',
        'total_microfinance_fees' => 'decimal:2',
        'status' => CreditRequestStatus::class,
        'submitted_at' => 'datetime',
        'validated_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Generate a unique code for the credit request.
     * Pattern: codePays_SCF_anneeMois_numeroIncrementé(000001)_nom_de_l'etudiant
     */
    public static function generateCode(Country $country, Stakeholder $student): string
    {
        $prefix = $country->code.'_SCF_'.now()->format('Ym');

        $lastRequest = self::where('code', 'like', $prefix.'%')
            ->orderBy('id', 'desc')
            ->first();

        $number = 1;
        if ($lastRequest) {
            // Extract the number from the code
            // Pattern is prefix_000001_lastname_firstname
            $parts = explode('_', $lastRequest->code);
            if (isset($parts[3])) {
                $number = (int) $parts[3] + 1;
            }
        }

        $numberStr = str_pad((string) $number, 6, '0', STR_PAD_LEFT);
        $studentName = str_replace(' ', '_', strtolower($student->last_name));
        $studentFirstName = str_replace(' ', '_', strtolower($student->first_name));

        return "{$prefix}_{$numberStr}_{$studentName}_{$studentFirstName}";
    }

    public function creditType(): BelongsTo
    {
        return $this->belongsTo(CreditType::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Stakeholder::class, 'student_id');
    }

    public function guarantor(): BelongsTo
    {
        return $this->belongsTo(Stakeholder::class, 'guarantor_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by_id');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by_id');
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(CreditRequestActivity::class)->latest();
    }

    public function installments(): HasMany
    {
        return $this->hasMany(CreditRequestInstallment::class)->orderBy('installment_number');
    }

    public function repayments(): HasMany
    {
        return $this->hasMany(CreditRequestRepayment::class)->latest();
    }

    public function terminationRequests(): HasMany
    {
        return $this->hasMany(LoanTerminationRequest::class)->latest();
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('documents')
            ->useDisk('s3');
    }

    /**
     * Get the required document types for a credit request.
     */
    public static function getRequiredDocumentTypes(): array
    {
        return [
            'demande_pret' => 'Demande de prêt',
            'engagement_rembourser' => 'Engagement à rembourser',
            'ouverture_compte' => 'Ouverture de compte',
            'recu_micro_finance' => 'Reçu de la micro-finance',
            'recu_apport_initial' => 'Reçu de l\'apport initial',
            'passport_etudiant' => 'Passeport de l\'étudiant',
            'cni_passport_garant' => 'CNI ou passeport du garant',
            'certificat_residence' => 'Certificat de résidence',
            'loan_contract' => 'Contrat de prêt',
        ];
    }

    /**
     * Get the missing documents for the credit request.
     */
    public function getMissingDocuments(): array
    {
        $requiredTypes = self::getRequiredDocumentTypes();
        $uploadedTypes = $this->media()
            ->where('collection_name', 'documents')
            ->get()
            ->map(function ($media) {
                return $media->getCustomProperty('type');
            })
            ->toArray();

        // Get documents currently in queue
        $inQueueTypes = [];

        $missing = [];
        foreach ($requiredTypes as $type => $label) {
            if (! in_array($type, $uploadedTypes)) {
                $missing[] = [
                    'type' => $type,
                    'label' => $label,
                    'is_processing' => false,
                ];
            }
        }

        return $missing;
    }

    /**
     * Get the types of documents that are currently being processed in the queue.
     */
    public function getDocumentsInQueue(): array
    {
        return [];
    }

    /**
     * Determine if the credit request has all required documents.
     */
    public function isComplete(): bool
    {
        return count($this->getMissingDocuments()) === 0;
    }

    /**
     * Déclenche la génération d'un document PDF à partir d'un template.
     */
    public function generateDocument(string $templateName, string $outputFileName, array $extraData = []): void
    {
        GenerateDocumentJob::dispatch(
            $templateName,
            $this,
            $outputFileName,
            $extraData
        );
    }

    public function calculateFees(): void
    {
        $this->loadMissing(['creditType', 'country']);

        $amount = (float) $this->amount_requested;
        $rate = (float) $this->creditType->rate;

        // - le montant de l'assurance (1% du montant du pret)
        $this->insurance_amount = $amount * 0.01;

        // - Frais de dossier (2% du montant du dossier a l'exception du pays Togo qui est a 1%)
        $isTogo = $this->country && (strtoupper($this->country->code) === 'TG' || stripos($this->country->name, 'Togo') !== false);
        $variableRate = $isTogo ? 0.01 : 0.02;
        $this->processing_fees_variable = $amount * $variableRate;

        // - Frais de dossier qui est invariable à 10000 fcfa
        $this->processing_fees_fixed = 10000;

        // - Interet du premier mois (calcul des interet sur la base de l'interet du pret par mois de facon dégressif)
        $monthlyRate = $rate / 100;
        $this->first_month_interest = $amount * $monthlyRate;

        // la somme de tous cela constitue les frais de micro finance.
        $this->total_microfinance_fees = $this->insurance_amount +
            $this->processing_fees_variable +
            $this->processing_fees_fixed +
            $this->first_month_interest;
    }
}
