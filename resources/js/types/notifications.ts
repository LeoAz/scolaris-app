export type NotificationData = {
    message: string;
    url?: string;
    credit_request_id?: number;
    code?: string;
    student_name?: string;
    [key: string]: any;
};

export type Notification = {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
};

export type NotificationProps = {
    list: Notification[];
};
