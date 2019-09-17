export class User {
  constructor(
    public email: string,
    public id: string,
    private tokenPrivate: string,
    private tokenExpirationDatePrivate: Date
  ) {}

  get token() {
    if (!this.tokenExpirationDatePrivate || new Date() > this.tokenExpirationDatePrivate) {
      return null;
    }

    return this.tokenPrivate;
  }
}
