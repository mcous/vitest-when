export class NotAMockFunctionError extends TypeError {
  constructor(value: unknown) {
    super(`when() must be given a Vitest mock, but received ${String(value)}`)
    this.name = 'NotAMockFunctionError'
  }
}
