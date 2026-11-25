/** Expected business-rule failures. Messages are safe to show to the user. */
export class TrainingError extends Error {
  constructor(
    message: string,
    readonly code:
      | "SESSION_NOT_FOUND"
      | "SESSION_ALREADY_EXISTS"
      | "STEP_NOT_FOUND"
      | "INVALID_MATCHES",
  ) {
    super(message);
    this.name = "TrainingError";
  }
}
