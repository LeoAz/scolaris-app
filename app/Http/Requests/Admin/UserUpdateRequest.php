<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UserUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user')->id;

        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$userId,
            'username' => 'required|string|max:255|unique:users,username,'.$userId,
            'password' => ['nullable', Password::defaults()],
            'roles' => 'required|array',
            'countries' => [
                'array',
                function ($attribute, $value, $fail) {
                    $roleIds = array_filter($this->roles ?? [], 'is_numeric');
                    $roleNames = array_filter($this->roles ?? [], fn ($r) => ! is_numeric($r));

                    $rolesFromIds = Role::whereIn('id', $roleIds)->pluck('name')->toArray();
                    $allRoles = array_unique(array_merge($roleNames, $rolesFromIds));

                    $isAdmin = count(array_intersect($allRoles, ['Super admin', 'Administrateur'])) > 0;

                    if (! $isAdmin && empty($value)) {
                        $fail('Le pays est requis pour ce rôle.');
                    }
                },
            ],
            'credit_types' => 'nullable|array',
            'credit_types.*' => 'exists:credit_types,id',
        ];
    }
}
