export interface PaginatedResponse<T> {
    data: T[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    permissions?: Permission[];
    created_at?: string;
    updated_at?: string;
}

export interface Permission {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface Country {
    id: number;
    code: string;
    name: string;
}

export interface CreditType {
    id: number;
    name: string;
    description?: string;
    rate: number;
    duration_months: number;
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    email_verified_at?: string;
    roles?: Role[];
    countries?: Country[];
    created_at?: string;
    updated_at?: string;
}

export interface Stakeholder {
    id: number;
    type: 'student' | 'guarantor';
    student_id?: number;
    first_name: string;
    last_name: string;
    email?: string;
    whatsapp_number?: string;
    other_number?: string;
    address?: string;
    profession?: string;
    amplitude_account?: string;
    amplitude_account_number?: string;
    id_card_number?: string;
    id_card_type?: string;
    student?: Stakeholder;
    guarantors?: Stakeholder[];
    created_at?: string;
    updated_at?: string;
}

export interface Media {
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    original_url: string;
    custom_properties?: {
        type?: string;
        [key: string]: any;
    };
    created_at: string;
}

export interface CreditRequestActivity {
    id: number;
    credit_request_id: number;
    user_id?: number;
    action: string;
    description?: string;
    properties?: any;
    user?: User;
    created_at: string;
    updated_at: string;
}

export interface CreditRequestRepayment {
    id: number;
    credit_request_id: number;
    installment_id: number;
    amount: string | number;
    repayment_date: string;
    payment_method: string;
    reference?: string;
    notes?: string;
    status: 'pending' | 'validated' | 'rejected';
    proof_url?: string;
    installment?: CreditRequestInstallment;
    validated_at?: string;
    validated_by_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreditRequestInstallment {
    id: number;
    credit_request_id: number;
    installment_number: number;
    due_date: string;
    principal_amount: string | number;
    interest_amount: string | number;
    total_amount: string | number;
    remaining_principal: string | number;
    status: 'pending' | 'paid' | 'cancelled';
    repayments?: CreditRequestRepayment[];
    created_at?: string;
    updated_at?: string;
}

export interface CreditRequest {
    id: number;
    code: string;
    credit_type_id: number;
    student_id: number;
    guarantor_id?: number;
    created_by_id?: number;
    country_id: number;
    amount_requested: string | number;
    initial_contribution: string | number;
    status: 'creation' | 'soumis' | 'valider' | 'rejeter' | 'cloturer' | 'resilie';
    submitted_at?: string;
    validated_at?: string;
    rejected_at?: string;
    validated_by_id?: number;
    rejected_by_id?: number;
    rejection_reason?: string;
    creation_date?: string;
    start_date?: string;
    end_date?: string;
    is_complete?: boolean;
    missing_documents?: { type: string; label: string; is_processing?: boolean }[];
    required_document_types?: Record<string, string>;
    total_paid?: number | string;
    total_repaid?: number | string;
    paid_installments_count?: number;
    remaining_to_pay?: number | string;
    last_repayment_amount?: number | string;
    next_installment?: CreditRequestInstallment | null;
    credit_type?: CreditType;
    student?: Stakeholder;
    guarantor?: Stakeholder;
    country?: Country;
    creator?: User;
    validator?: User;
    rejector?: User;
    media?: Media[];
    activities?: PaginatedResponse<CreditRequestActivity>;
    installments?: CreditRequestInstallment[];
    repayments?: CreditRequestRepayment[];
    created_at?: string;
    updated_at?: string;
}
