export interface RefreshStatus {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
  };
}
