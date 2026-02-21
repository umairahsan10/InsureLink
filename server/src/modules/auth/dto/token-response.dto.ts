export class TokenResponseDto {
  access_token: string;
  refresh_token: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
    organizationId?: string;
  };
}
