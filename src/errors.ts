export class NotAMockFunctionError extends TypeError {
  constructor(value: unknown) {
    super(`when() must be given a Vite mock, but received ${String(value)}`)
    this.name = 'NotAMockFunctionError'
  }
}
