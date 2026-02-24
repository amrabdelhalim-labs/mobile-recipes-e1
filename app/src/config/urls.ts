// API URLs matching server routes
// IMPORTANT: VITE_API_URL must be set in GitHub Actions Variables (NOT Secrets)
// Example: https://my-server.herokuapp.com or https://api.myapp.com
const envApiUrl = import.meta.env.VITE_API_URL;
export const API_URL = envApiUrl && envApiUrl.trim() !== '' ? envApiUrl : 'http://localhost:3000';

// Account routes (/account)
export const REGISTER_URL = 'account/register';
export const LOGIN_URL = 'account/login';
export const PROFILE_URL = 'account/profile';
export const PROFILE_UPDATE_INFO_URL = 'account/profile/info';
export const PROFILE_UPDATE_IMAGE_URL = 'account/profile/image';
export const PROFILE_RESET_IMAGE_URL = 'account/profile/image/reset';
export const PROFILE_DELETE_URL = 'account/profile';

// Post routes (/posts)
export const GET_ALL_POSTS = 'posts';
export const GET_MY_POSTS = 'posts/me';
export const CREATE_POST = 'posts/create';
export const GET_POST_BY_ID = (id: string | number) => `posts/${id}`;
export const UPDATE_POST = (id: string | number) => `posts/${id}`;
export const DELETE_POST = (id: string | number) => `posts/${id}`;

// Comment routes (/comments)
export const GET_MY_COMMENTS = 'comments/me';
export const ADD_COMMENT = (postId: string | number) => `comments/${postId}`;
export const UPDATE_COMMENT = (id: string | number) => `comments/${id}`;
export const DELETE_COMMENT = (id: string | number) => `comments/${id}`;

// Like routes (/likes)
export const TOGGLE_LIKE = (postId: string | number) => `likes/${postId}`;
export const GET_MY_LIKES = 'likes/me';
export const GET_POST_LIKES = (postId: string | number) => `likes/${postId}`;
