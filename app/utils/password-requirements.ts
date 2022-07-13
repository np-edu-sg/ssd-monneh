export const message =
    'New password must have a minimum of eight characters, at least one uppercase letter, one lowercase letter, one number and one special character'
export const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g
