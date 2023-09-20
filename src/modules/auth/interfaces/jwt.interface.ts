export interface JWTPayload {
  id: string;
  email: string;
}

export interface JWTPayloadRefreshToken {
  id: string;
}
