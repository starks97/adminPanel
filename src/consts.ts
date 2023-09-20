export const AUTH_TOKEN = 'auth_token';
export const REFRESH_TOKEN = 'refresh_token';

export const cacheBlogIDKey = 'blog: + id';
export const cacheBlogSlugKey = 'blog: + slug';

export const refreshKey = (email: string) => {
  return `user:${email}`;
};

export const expirationTime = 7 * 24 * 60 * 60 * 1000;
