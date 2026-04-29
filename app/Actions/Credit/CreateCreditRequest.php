<?php

namespace App\Actions\Credit;

use App\Enums\CreditRequestStatus;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\Stakeholder;
use App\Notifications\CreditRequestCreated;
use App\Traits\NotifiesStakeholders;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CreateCreditRequest
{
    use NotifiesStakeholders;

    public function execute(Request $request): CreditRequest
    {
        return DB::transaction(function () use ($request) {
            // 1. Handle Student (Create or Update)
            $student = Stakeholder::updateOrCreate(
                ['email' => $request->input('student.email')],
                array_merge($request->student, ['type' => 'student'])
            );

            // 2. Handle Guarantor (if provided)
            $guarantorId = null;
            if ($request->filled('guarantor.last_name')) {
                if ($request->filled('guarantor.id')) {
                    $guarantor = Stakeholder::findOrFail($request->input('guarantor.id'));
                    $guarantor->update(array_merge($request->guarantor, ['student_id' => $student->id]));
                    $guarantorId = $guarantor->id;
                } elseif ($request->filled('guarantor.email')) {
                    $guarantor = Stakeholder::updateOrCreate(
                        ['email' => $request->input('guarantor.email')],
                        array_merge($request->guarantor, [
                            'type' => 'guarantor',
                            'student_id' => $student->id,
                        ])
                    );
                    $guarantorId = $guarantor->id;
                } else {
                    $guarantor = Stakeholder::create(array_merge($request->guarantor, [
                        'type' => 'guarantor',
                        'student_id' => $student->id,
                    ]));
                    $guarantorId = $guarantor->id;
                }
            }

            // 3. Generate Code
            $country = Country::findOrFail($request->country_id);
            $code = CreditRequest::generateCode($country, $student);

            // 4. Create Credit Request
            $creditRequest = CreditRequest::create([
                'code' => $code,
                'country_id' => $request->country_id,
                'credit_type_id' => $request->credit_type_id,
                'student_id' => $student->id,
                'guarantor_id' => $guarantorId,
                'amount_requested' => $request->amount_requested,
                'initial_contribution' => $request->initial_contribution ?? 0,
                'created_at' => $request->creation_date,
                'status' => CreditRequestStatus::CREATION->value,
                'created_by_id' => auth()->id(),
            ]);

            $creditRequest->calculateFees();
            $creditRequest->save();

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'creation',
                'description' => 'Création initiale du dossier.',
            ]);

            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $creditRequest->addMedia($file)->toMediaCollection('documents');
                }
            }

            // 5. Send Notifications
            $allRecipients = $this->getStakeholders($creditRequest->country_id);
            if (auth()->check()) {
                $allRecipients->push(auth()->user());
            }
            $allRecipients = $allRecipients->unique('id');

            Notification::send($allRecipients, new CreditRequestCreated($creditRequest));

            return $creditRequest;
        });
    }
}
