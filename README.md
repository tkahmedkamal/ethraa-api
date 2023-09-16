# Ethraa App

### Ethraa website is a multi-user platform where users share quotations to disseminate knowledge.

## Tech Stack

- [NestJs](https://nestjs.com/)
- [Mongodb ( Mongoose )](https://mongoosejs.com/)

## Multi Languages [i18n](https://www.npmjs.com/package/nestjs-i18n)

- Arabic
- English

## Api Link
[https://ethraa-api.up.railway.app/api](https://ethraa-api.up.railway.app/api)

## API Reference

#### Auth Endpoints

```
  POST /api/auth/signup
```

```
  POST /api/auth/login
```

```
  POST /api/auth/forgot-password
```

```
  POST /api/auth/verify-account-token
```

```
  PATCH /api/auth/reset-password?token=${token}
```

```
  PATCH /api/auth/activate-account?token=${token}
```

#### User Endpoints

```
  GET /api/users/me
```

```
  PATCH /api/users/update-me
```

```
  PATCH /api/users/update-me-password
```

```
  DELETE /api/users/delete-me
```

```
  GET /api/users
```

```
  GET /api/users/${username}
```

```
  GET /api/users/top-liked-posts-users
```

```
  GET /api/users/suggest-following
```

```
  GET /api/users/for-users/${username}
```

```
  PATCH /api/users/${username}
```

```
  PATCH /api/users/update-password/${username}
```

```
  PATCH /api/users/upload-avatar/${username}
```

```
  PATCH /api/users/deactivate
```

```
  PATCH /api/users/follow/${username}
```

```
  DELETE /api/users/${username}
```

```
  DELETE /api/users
```

#### Post Endpoints

```
  GET /api/posts
```

```
  GET /api/posts/for-user/${username}
```

```
  GET /api/posts/for-users
```

```
  GET /api/posts/following-posts
```

```
  GET /api/posts/top-fifty-posts
```

```
  GET /api/posts/${id}
```

```
  POST /api/posts
```

```
  PATCH /api/posts
```

```
  PATCH /api/posts/like
```

```
  PATCH /api/posts/dislike
```

```
  DELETE /api/posts
```

```
  DELETE /api/posts/delete-all
```

#### Bookmark Endpoints

```
  GET /api/bookmarks
```

```
  GET /api/bookmarks/find-for-user
```

```
  POST /api/bookmarks
```

```
  DELETE /api/bookmarks/${id}
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Stay in touch

- [Facebook](https://www.facebook.com/tkahmedkamal/)
- [Linkedin](https://www.linkedin.com/in/tkahmedkamal/)
