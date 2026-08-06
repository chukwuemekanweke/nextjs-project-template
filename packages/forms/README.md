# `@template/forms`

Reusable React Hook Form and Zod composition for application-owned workflows.

- `useValidatedForm` enables touched-field validation and validates again as the user edits.
- `ValidatedForm` supplies form context and uses React Hook Form's guarded submit lifecycle.
- `TextField` and `PasswordField` connect accessible labels, hints, field errors, and password visibility.
- `SubmitButton` disables itself while React Hook Form or an application mutation is pending.
- `applyBackendValidation` maps authoritative `ApiError.validationErrors` to known fields and returns unknown errors for form-level display.

Schemas, submit handlers, product copy, notifications, navigation, and the list of accepted backend fields remain in the consuming application.
