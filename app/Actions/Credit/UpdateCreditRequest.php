<?php

namespace App\Actions\Credit;

use App\Models\CreditRequest;
use App\Models\Stakeholder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UpdateCreditRequest
{
    public function execute(Request $request, CreditRequest $creditRequest): CreditRequest
    {
        return DB::transaction(function () use ($request, $creditRequest) {
            // Update Student
            $student = Stakeholder::findOrFail($request->input('student.id'));
            $student->update($request->student);

            // Update/Create Guarantor
            $guarantorId = $creditRequest->guarantor_id;
            if ($request->filled('guarantor.last_name')) {
                if ($request->filled('guarantor.id')) {
                    $guarantor = Stakeholder::findOrFail($request->input('guarantor.id'));
                    $guarantor->update(array_merge($request->guarantor, ['student_id' => $creditRequest->student_id]));
                    $guarantorId = $guarantor->id;
                } else {
                    $guarantor = Stakeholder::create(array_merge($request->guarantor, [
                        'type' => 'guarantor',
                        'student_id' => $creditRequest->student_id,
                    ]));
                    $guarantorId = $guarantor->id;
                }
            }

            // Update Credit Request
            $creditRequest->update([
                'country_id' => $request->country_id,
                'credit_type_id' => $request->credit_type_id,
                'guarantor_id' => $guarantorId,
                'amount_requested' => $request->amount_requested,
                'initial_contribution' => $request->initial_contribution ?? 0,
                'created_at' => $request->creation_date,
            ]);

            $creditRequest->calculateFees();
            $creditRequest->save();

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'update',
                'description' => 'Mise à jour des informations du dossier.',
            ]);

            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $creditRequest->addMedia($file)->toMediaCollection('documents');
                }
            }

            return $creditRequest;
        });
    }
}
